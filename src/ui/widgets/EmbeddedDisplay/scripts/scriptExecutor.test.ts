import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { iFrameScriptExecutionHandlerCode } from "./scriptExecutor";

describe("iFrameScriptExecutionHandlerCode", () => {
  let iframe: HTMLIFrameElement;
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

    expect(iframe.contentWindow).not.toBeNull();
    if (iframe.contentWindow) {
      // Override the postMessage method on the iframe's parent
      Object.defineProperty(iframe.contentWindow, "parent", {
        value: {
          postMessage: postMessageMock
        },
        configurable: true
      });

      const messageData = {
        functionCode: "return 40 + 2;",
        widget: {},
        PVs: []
      };

      const messageEvent = new MessageEvent("message", {
        data: messageData,
        source: null
      });

      // Send the code to the iframe via a message
      iframe.contentWindow.dispatchEvent(messageEvent);

      // Short wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate that the dynamic script executed as expected
      expect(postMessageMock).toHaveBeenCalledWith(42, "*");
    }
  });

  it("should execute code containing some Phoebus built ins and return results via postMessage", async () => {
    const postMessageMock = vi.fn();

    expect(iframe.contentWindow).not.toBeNull();
    if (iframe.contentWindow) {
      // Override the postMessage method on the iframe's parent
      Object.defineProperty(iframe.contentWindow, "parent", {
        value: {
          postMessage: postMessageMock
        },
        configurable: true
      });

      const script = `
        importClass(org.csstudio.display.builder.runtime.script.PVUtil);
        importClass(org.csstudio.display.builder.runtime.script.ScriptUtil);
        importPackage(Packages.org.csstudio.opibuilder.scriptUtil);

        // widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(255, 255, 0));

        return PVUtil.getDouble(1+2);
      `;

      const messageData = {
        functionCode: script,
        widget: {},
        PVs: []
      };

      const messageEvent = new MessageEvent("message", {
        data: messageData,
        source: null
      });

      // Send the code to the iframe via a message
      iframe.contentWindow.dispatchEvent(messageEvent);

      // Short wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate that the dynamic script executed as expected
      expect(postMessageMock).toHaveBeenCalledWith(3, "*");
    }
  });

  it("should handle exception in the dynamic code and send error message via postMessage", async () => {
    const postMessageMock = vi.fn();

    expect(iframe.contentWindow).not.toBeNull();
    if (iframe.contentWindow) {
      // Override the postMessage method on the iframe's parent
      Object.defineProperty(iframe.contentWindow, "parent", {
        value: {
          postMessage: postMessageMock
        },
        configurable: true
      });

      const messageData = {
        functionCode: 'throw new Error("Test error");',
        widget: {},
        PVs: []
      };

      // Create a test message event with invalid code
      const messageEvent = new MessageEvent("message", {
        data: messageData,
        source: null
      });

      // Dispatch the event to the iframe's contentWindow
      iframe.contentWindow.dispatchEvent(messageEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if postMessage was called with the expected error message
      expect(postMessageMock).toHaveBeenCalledWith("Error: Test error", "*");
    }
  });
});
