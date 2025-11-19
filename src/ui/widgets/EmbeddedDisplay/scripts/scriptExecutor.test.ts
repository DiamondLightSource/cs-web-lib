import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { iFrameScriptExecutionHandlerCode } from "./scriptExecutor";
import { Procedure } from "@vitest/spy";

describe("iFrameScriptExecutionHandlerCode", () => {
  let iframe: HTMLIFrameElement;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let messageEventListener: (event: MessageEvent) => void;

  beforeEach(() => {
    // Create a spy on window.addEventListener to capture the message event handler
    vi.spyOn(window, "addEventListener").mockImplementation(
      (event, handler) => {
        if (event === "message") {
          messageEventListener = handler as any;
        }
      }
    );

    // Create a spy on window.postMessage
    vi.spyOn(window, "postMessage").mockImplementation(() => {});

    // Build the iframe
    iframe = document.createElement("iframe");
    document.body.appendChild(iframe);

    if (iframe.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(iFrameScriptExecutionHandlerCode);
      iframe.contentDocument.close();
    }
  });

  afterEach(() => {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    vi.restoreAllMocks();
  });

  it("should execute simple dynamic code and return results via postMessage", async () => {
    const postMessageMock = vi.fn();

    const messageData = {
      functionCode: "return 40 + 2;",
      id: 1234,
      pvs: []
    };

    await postTestMessageToIframe(iframe, postMessageMock, messageData);

    // Validate that the dynamic script executed as expected
    expect(postMessageMock).toHaveBeenCalledWith(
      { id: 1234, functionReturnValue: 42, widgetProps: {} },
      "*"
    );
  });

  it("should execute code containing some Phoebus built ins and return results via postMessage", async () => {
    const postMessageMock = vi.fn();
    const testScript = `
      importClass(org.csstudio.display.builder.runtime.script.PVUtil);
      importClass(org.csstudio.display.builder.runtime.script.ScriptUtil);
      importPackage(Packages.org.csstudio.opibuilder.scriptUtil);
      return PVUtil.getDouble(1+2);
    `;

    const messageData = {
      functionCode: testScript,
      id: 3456,
      pvs: []
    };

    await postTestMessageToIframe(iframe, postMessageMock, messageData);

    expect(postMessageMock).toHaveBeenCalledWith(
      { id: 3456, functionReturnValue: 3, widgetProps: {} },
      "*"
    );
  });

  it("should execute code containing widget.setPropertyValue and return results via postMessage in widgetProps", async () => {
    const postMessageMock = vi.fn();
    const testScript = `
      widget.setPropertyValue("x", PVUtil.getDouble(1+2));
      widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(255, 0, 255));
      widget.setPropertyValue("foreground_color", ColorFontUtil.YELLOW);
    `;

    const messageData = {
      functionCode: testScript,
      id: 73734,
      pvs: []
    };

    await postTestMessageToIframe(iframe, postMessageMock, messageData);
    expect(postMessageMock).toHaveBeenCalledWith(
      {
        id: 73734,
        functionReturnValue: undefined,
        widgetProps: {
          x: 3,
          background_color: {
            text: "rgba(255,0,255,1)",
            type: "rgbaColor"
          },
          foreground_color: {
            text: "rgba(255,255,0,1)",
            type: "rgbaColor"
          }
        }
      },
      "*"
    );
  });

  it("should execute code that uses a pv values and return results via postMessage in widgetProps", async () => {
    const postMessageMock = vi.fn();

    const testScript = `
      const value = PVUtil.getDouble(pvs[0]);
      if (value > 299) {
          widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(255, 255, 0));
      } else {
          widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(128, 255, 255));
      }
    `;

    const messageData1 = {
      functionCode: testScript,
      id: 73734,
      pvs: [301]
    };

    const messageData2 = {
      functionCode: testScript,
      id: 9098,
      pvs: [298]
    };

    await postTestMessageToIframe(iframe, postMessageMock, messageData1);
    await postTestMessageToIframe(iframe, postMessageMock, messageData2);

    expect(postMessageMock).toHaveBeenCalledWith(
      {
        id: 73734,
        functionReturnValue: undefined,
        widgetProps: {
          background_color: {
            text: "rgba(255,255,0,1)",
            type: "rgbaColor"
          }
        }
      },
      "*"
    );

    expect(postMessageMock).toHaveBeenCalledWith(
      {
        id: 9098,
        functionReturnValue: undefined,
        widgetProps: {
          background_color: {
            text: "rgba(128,255,255,1)",
            type: "rgbaColor"
          }
        }
      },
      "*"
    );
  });

  it("should handle exception in the dynamic code and send error message via postMessage", async () => {
    const postMessageMock = vi.fn();

    const messageData = {
      functionCode: 'throw new Error("Test error");',
      id: 6789,
      pvs: []
    };

    await postTestMessageToIframe(iframe, postMessageMock, messageData);

    // Check if postMessage was called with the expected error message
    expect(postMessageMock).toHaveBeenCalledWith(
      { id: 6789, error: "Error: Test error" },
      "*"
    );
  });
});

const postTestMessageToIframe = async (
  iframe: HTMLIFrameElement,
  postMessageMock: Mock<Procedure>,
  messageData: { functionCode: string; id: number; pvs: any[] }
) => {
  Object.defineProperty(iframe.contentWindow, "parent", {
    value: {
      postMessage: postMessageMock
    },
    configurable: true
  });

  const messageEvent = new MessageEvent("message", {
    data: messageData,
    source: null
  });

  expect(iframe.contentWindow).not.toBeNull();
  if (iframe.contentWindow) {
    // Send the code and pv values to the iframe via a message
    iframe.contentWindow.dispatchEvent(messageEvent);
  }

  // Short wait for async execution to complete
  await new Promise(resolve => setTimeout(resolve, 200));
};
