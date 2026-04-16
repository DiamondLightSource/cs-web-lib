import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

const parentOrigin = window.location.origin;
const SANDBOX_ORIGIN = "null";

let iFrameSandboxScriptRunner: HTMLIFrameElement | null = null;
let iFrameSandboxReady = false;

export interface ScriptResponse {
  functionReturnValue: any;
  widgetProps: {
    [key: string]: any;
  };
}

// Define the IFrame HTML and javascript to handle execution of dynamic scripts.
// It also mocks/implements a small subset of the Phoebus script API sufficient for our PoC cases.
export const iFrameScriptExecutionHandlerCode = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-eval' 'unsafe-inline'; connect-src 'none'; frame-src 'none'; object-src 'none';">
      <script>
        const PARENT_ORIGIN = "${parentOrigin}"
        const mockPhoebusApi = {
          importClass: (a) => {},
          importPackage: (a) => {},
          PVUtil: {
            getDouble: (value) => value.number,
            getString: (value) => value.string,
          },
          org: {
            csstudio: { display: { builder: { runtime: { script: { PVUtil: undefined, ScriptUtil: undefined } } } } }
          },
          Packages: {
            org: { csstudio: { opibuilder: { scriptUtil: undefined } } }
          },
          ColorFontUtil: {
            getColorFromRGB: (r, g, b) => ({ text: "rgba(" + r + "," + g + "," + b + ",1)", type: "rgbaColor" }),
            WHITE: { text: "rgba(255,255,255,1)", type: "rgbaColor" },
            GRAY: { text: "rgba(220,220,220,1)", type: "rgbaColor" },
            BLACK: { text: "rgba(0,0,0,1)", type: "rgbaColor" },
            BLUE: { text: "rgba(0,0,255,1)", type: "rgbaColor" },
            RED: { text: "rgba(255,0,0,1)", type: "rgbaColor" },
            GREEN: { text: "rgba(0,255,0,1)", type: "rgbaColor" },
            YELLOW: { text: "rgba(255,255,0,1)", type: "rgbaColor" },
            PURPLE: { text: "rgba(127,0,127,1)", type: "rgbaColor" },
            PINK: { text: "rgba(255,192,203,1)", type: "rgbaColor" },
            ORANGE: { text: "rgba(255,165,0,1)", type: "rgbaColor" }
          }
        };

        window.addEventListener('message', async (event) => {
          if (event.origin !== PARENT_ORIGIN) {
            return;
          }        
          // Validate message origin
          if (event.source !== window.parent) {
            return;
          }
          const id = event?.data?.id;
          if (!id) return;

          try {
            const widget = {
              props: {},
              setPropertyValue(key, value) {
                this.props[key] = value;
              },
            };

            const functionCode = event?.data?.functionCode;
            const pvs = event?.data?.pvs;

            const fn = new Function(...Object.keys(mockPhoebusApi), 'widget', 'pvs', functionCode);
            const result = await fn(...Object.values(mockPhoebusApi), widget, pvs);

            window.parent.postMessage({
              widgetProps: widget.props, 
              functionReturnValue: result, 
              id: id
            }, PARENT_ORIGIN);
          } catch (error) {
            window.parent.postMessage({
              error: "Error: " + error.message, 
              id: id
            }, PARENT_ORIGIN);
          }
        });
        window.parent.postMessage('IFRAME_READY', PARENT_ORIGIN);
      </script>
    </head>
  </html>
`;

/***
 * A function that creates a sandboxed IFrame, in which to execute dynamic scripts.
 * On first execution it will set the singleton iFrameScriptRunner variable, and return iFrameScriptRunner
 * On subsequent execution it will return the same instance of iFrameScriptRunner
 * @returns An instance of HTMLIFrameElement.
 */
const buildSandboxIframe = async (): Promise<HTMLIFrameElement> => {
  return new Promise<HTMLIFrameElement>((resolve, reject) => {
    if (iFrameSandboxScriptRunner) {
      resolve(iFrameSandboxScriptRunner);
      return;
    }

    iFrameSandboxScriptRunner = document.createElement("iframe");
    iFrameSandboxScriptRunner.setAttribute("sandbox", "allow-scripts");
    iFrameSandboxScriptRunner.style.width = "0";
    iFrameSandboxScriptRunner.style.height = "0";
    iFrameSandboxScriptRunner.style.visibility = "hidden";
    iFrameSandboxScriptRunner.style.border = "0";
    iFrameSandboxScriptRunner.style.pointerEvents = "none";
    iFrameSandboxScriptRunner.setAttribute("tabindex", "-1");
    iFrameSandboxScriptRunner.setAttribute("aria-hidden", "true");
    iFrameSandboxScriptRunner.id = "script-runner-iframe";

    let hasTimedOut = false;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
    };

    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      cleanup();
      log.warn("The creation of a script execution iframe timed out.");
      reject(new Error("The creation of a script execution iframe timed out"));
    }, 5000);

    // This adds an event listen to receive the IFRAME_READY message, that is sent by the iFrame when it is ready to run scripts.
    const onMessage = (event: MessageEvent) => {
      if (hasTimedOut) return;

      if (event.origin !== SANDBOX_ORIGIN) {
        return;
      }

      // Accept only messages from the IFrame sandbox
      if (iFrameSandboxScriptRunner?.contentWindow !== event.source) {
        return;
      }

      if (event.data === "IFRAME_READY") {
        clearTimeout(timeoutId);
        cleanup();
        log.debug("The script runner iframe has started");
        iFrameSandboxReady = true;
        resolve(iFrameSandboxScriptRunner as HTMLIFrameElement);
      }
    };

    window.addEventListener("message", onMessage);

    iFrameSandboxScriptRunner.srcdoc = iFrameScriptExecutionHandlerCode;

    document.body.appendChild(iFrameSandboxScriptRunner);
  });
};

/***
 * A function that executes a Phoebos embedded script within a sandbox iFrame.
 * On first execution it will set the singleton iFrameScriptRunner variable.
 * On subsequent execution it will use the existing instance of iFrameScriptRunner
 * @param dynamicScriptCode the code to execute in the sandbox
 * @param pvs an array of PV values that are used by the script
 * @returns A dictionary that contains the return value of the function and a dictionary of the widget props that have been updated
 */
export const executeDynamicScriptInSandbox = async (
  dynamicScriptCode: string,
  pvs: { number: number | undefined; string: string | undefined }[]
): Promise<ScriptResponse> => {
  if (!iFrameSandboxScriptRunner) {
    await buildSandboxIframe();
  }

  if (!iFrameSandboxReady) {
    // The iFrame sandbox is still starting up, this can happen on app startup.
    // We don't want to block, so log and return an empty response.
    log.warn(
      "The Iframe sandbox is starting up, dynamic script execution skipped on this occasion."
    );
    return {
      functionReturnValue: "",
      widgetProps: {}
    };
  }

  if (!iFrameSandboxScriptRunner?.contentWindow) {
    throw new Error("Iframe content window not available");
  }

  return new Promise<any>((resolve, reject) => {
    const id = uuidv4();

    let hasTimedOut = false;

    const cleanup = () => {
      window.removeEventListener("message", messageHandler);
    };

    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      cleanup();
      reject(new Error("Dynamic script execution timed out"));
    }, 1000);

    // Define a message handler to receive the responses from the IFrame.
    const messageHandler = (event: MessageEvent) => {
      if (hasTimedOut) return;

      if (event.origin !== SANDBOX_ORIGIN) {
        return;
      }

      if (event.source !== iFrameSandboxScriptRunner?.contentWindow) {
        return;
      }

      if (event.data?.id !== id) {
        return;
      }

      clearTimeout(timeoutId);
      cleanup();

      if (!event.data?.error) {
        // Success return the response data.
        resolve({
          functionReturnValue: event.data?.functionReturnValue,
          widgetProps: event.data?.widgetProps
        });
      } else {
        reject(event.data?.error);
      }
    };

    window.addEventListener("message", messageHandler);

    // Send a message containing the script and pv values to the IFrame to trigger the execution of the script.
    iFrameSandboxScriptRunner?.contentWindow?.postMessage(
      {
        functionCode: dynamicScriptCode,
        id,
        pvs
      },
      "*"
    );
  });
};
