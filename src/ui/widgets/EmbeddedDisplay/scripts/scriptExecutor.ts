/*
  importClass(org.csstudio.display.builder.runtime.script.PVUtil);
  importClass(org.csstudio.display.builder.runtime.script.ScriptUtil);
  importPackage(Packages.org.csstudio.opibuilder.scriptUtil);
  logger = ScriptUtil.getLogger();
  logger.info("Hello")
  var value = PVUtil.getDouble(pvs[0]);

  if (value > 299) {
    widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(255, 255, 0));
  } else {
    widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(128, 255, 255));
  }
*/
import log from "loglevel";

let iFrameScriptRunner: HTMLIFrameElement | null = null;

export const iFrameScriptExecutionHandlerCode = `
  <!DOCTYPE html>
  <html>
    <head>
      <script>
        const mockPhoebusApi = {
          importClass: (a) => {},
          importPackage: (a) => {},
          PVUtil: {
            getDouble: (value) => Number(value),
          },
          org: {
            csstudio: { display: { builder: { runtime: { script: { PVUtil: undefined, ScriptUtil: undefined } } } } }
          },
          Packages: {
            org: { csstudio: { opibuilder: { scriptUtil: undefined } } }
          }
        };

        window.addEventListener('message', async (event) => {
          try {
            const widget = event?.data?.widget;
            const functionCode = event?.data?.functionCode;

            const fn = new Function(...Object.keys(mockPhoebusApi), 'widget', functionCode);
            const result = await fn(...Object.values(mockPhoebusApi), widget);
            window.parent.postMessage(result, '*');
          } catch (error) {
            window.parent.postMessage("Error: " + error.message, '*');
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
const buildIframe = async (): Promise<HTMLIFrameElement> => {
  return new Promise<HTMLIFrameElement>((resolve, reject) => {
    if (iFrameScriptRunner) {
      resolve(iFrameScriptRunner);
      return;
    }

    iFrameScriptRunner = document.createElement("iframe");
    iFrameScriptRunner.setAttribute("sandbox", "allow-scripts");
    iFrameScriptRunner.style.display = "none";
    iFrameScriptRunner.id = "script-runner-iframe";

    // This adds an event listen to recieve the IFRAME_READY message, that is sent by the iFrame when it is ready to run scripts.
    const onMessage = (event: MessageEvent) => {
      if (event.data === "IFRAME_READY") {
        log.debug(
          `The script runner iframe has started the following messeage was recievd: ${event.data}`
        );
        window.removeEventListener("message", onMessage);
        resolve(iFrameScriptRunner as HTMLIFrameElement);
      }
    };

    window.addEventListener("message", onMessage);

    iFrameScriptRunner.onload = () => {
      if (!iFrameScriptRunner) {
        return;
      }
      iFrameScriptRunner.srcdoc = iFrameScriptExecutionHandlerCode;
    };

    document.body.appendChild(iFrameScriptRunner);

    setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("The creation of a script execution iframe timed out"));
    }, 5000);
  });
};

export const runScript = async (code: string): Promise<any> => {
  if (!iFrameScriptRunner) {
    await buildIframe();
  }

  if (!iFrameScriptRunner?.contentWindow) {
    throw new Error("Iframe content window not available");
  }

  return new Promise<any>((resolve, reject) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.source === iFrameScriptRunner?.contentWindow) {
        window.removeEventListener("message", messageHandler);
        resolve(event.data);
      }
    };

    window.addEventListener("message", messageHandler);

    setTimeout(() => {
      window.removeEventListener("message", messageHandler);
      reject(new Error("Script execution timed out"));
    }, 5000);

    iFrameScriptRunner?.contentWindow?.postMessage(code, "*");
  });
};
