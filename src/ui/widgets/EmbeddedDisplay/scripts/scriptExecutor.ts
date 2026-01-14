import log from "loglevel";
import { v4 as uuidv4 } from "uuid";

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
      <script>
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
          const id = event?.data?.id;
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
            window.parent.postMessage({widgetProps: widget.props, functionReturnValue: result, id: id}, '*');
          } catch (error) {
            window.parent.postMessage({error: "Error: " + error.message, id: id}, '*');
          }
        });
        window.parent.postMessage('IFRAME_READY', '*');
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
    iFrameSandboxScriptRunner.style.display = "none";
    iFrameSandboxScriptRunner.id = "script-runner-iframe";

    // This adds an event listen to receive the IFRAME_READY message, that is sent by the iFrame when it is ready to run scripts.
    const onMessage = (event: MessageEvent) => {
      if (
        event.data === "IFRAME_READY" &&
        event.source === iFrameSandboxScriptRunner?.contentWindow
      ) {
        log.debug("The script runner iframe has started");
        iFrameSandboxReady = true;
        window.removeEventListener("message", onMessage);
        resolve(iFrameSandboxScriptRunner as HTMLIFrameElement);
      }
    };

    window.addEventListener("message", onMessage);

    setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("The creation of a script execution iframe timed out"));
    }, 1000);

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

    // Define a message handler to receive the responses from the IFrame.
    const messageHandler = (event: MessageEvent) => {
      if (
        event.data?.id === id &&
        event.source === iFrameSandboxScriptRunner?.contentWindow &&
        event.data !== "IFRAME_READY"
      ) {
        window.removeEventListener("message", messageHandler);
        if (!event.data?.error) {
          // Success return the response data.
          resolve({
            functionReturnValue: event.data?.functionReturnValue,
            widgetProps: event.data?.widgetProps
          });
        } else {
          reject(event.data?.error);
        }
      }
    };

    window.addEventListener("message", messageHandler);

    setTimeout(() => {
      window.removeEventListener("message", messageHandler);
      reject(new Error("Dynamic script execution timed out"));
    }, 1000);

    // Send a message containing the script and pv values to the IFrame to trigger the execution of the script.
    iFrameSandboxScriptRunner?.contentWindow?.postMessage(
      { functionCode: dynamicScriptCode, id, pvs },
      "*"
    );
  });
};
