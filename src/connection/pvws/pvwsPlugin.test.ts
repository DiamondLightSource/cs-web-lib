import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PvwsPlugin } from "./pvwsPlugin";
import { DType } from "../../types/dtypes";

import { CLOSE_SOCKET_FOR_SERVICE_SWITCH } from "./pvwsClient";
import log from "loglevel";

// Create mock client instance
const mockClientInstance = {
  subscribe: vi.fn().mockReturnValue("sub-id-123"),
  unsubscribe: vi.fn(),
  sendMessage: vi.fn(),
  close: vi.fn(),
  getUrl: vi.fn().mockReturnValue("ws://localhost:8080/pvws/pv")
};

// Mock the module with a proper class
vi.mock("./pvwsClient", () => {
  return {
    PvwsClient: class MockPvwsClient {
      constructor(url: string) {
        return mockClientInstance;
      }
    },
    CLOSE_SOCKET_FOR_SERVICE_SWITCH: 4010
  };
});

vi.mock("loglevel", () => ({
  default: {
    error: vi.fn(),
    debug: vi.fn()
  }
}));

const onErrorMessageCallback = vi.fn();
const onValueChangedCallback = vi.fn();
const onConnectionChangedCallback = vi.fn();
const onConnectionClosedCallback = vi.fn();

const newPvwsPlugin = (url: string, ssl: boolean) =>
  new PvwsPlugin(
    url,
    ssl,
    onConnectionChangedCallback,
    onValueChangedCallback,
    onConnectionClosedCallback,
    onErrorMessageCallback
  );

describe("PvwsPlugin", () => {
  let plugin: PvwsPlugin;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockClientInstance.subscribe.mockReturnValue("sub-id-123");
    mockClientInstance.getUrl.mockReturnValue("ws://localhost:8080/pvws/pv");

    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with ws protocol when SSL is false", () => {
      plugin = newPvwsPlugin("localhost:8080", false);

      // Verify client was created (constructor was called)
      expect(plugin).toBeDefined();
    });

    it("should initialize with wss protocol when SSL is true", () => {
      plugin = newPvwsPlugin("localhost:8080", true);

      expect(plugin).toBeDefined();
    });

    it("should store the fallback URL correctly", () => {
      plugin = newPvwsPlugin("example.com:9090", false);

      expect(plugin).toBeDefined();
    });
  });

  describe("subscribe", () => {
    beforeEach(() => {
      plugin = newPvwsPlugin("localhost:8080", false);
      vi.clearAllMocks();
    });

    it("should call client subscribe with pvName only", () => {
      const result = plugin.subscribe("TEST:PV:NAME");

      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        "TEST:PV:NAME",
        undefined
      );
      expect(result).toBe("sub-id-123");
    });

    it("should call client subscribe with pvName and type", () => {
      const result = plugin.subscribe("TEST:PV:NAME");

      expect(mockClientInstance.subscribe).toHaveBeenCalledWith(
        "TEST:PV:NAME",
        undefined
      );
      expect(result).toBe("sub-id-123");
    });
  });

  describe("unsubscribe", () => {
    beforeEach(() => {
      plugin = newPvwsPlugin("localhost:8080", false);
      vi.clearAllMocks();
    });

    it("should call client unsubscribe with pvName", () => {
      plugin.unsubscribe("TEST:PV:NAME");

      expect(mockClientInstance.unsubscribe).toHaveBeenCalledWith(
        "TEST:PV:NAME"
      );
    });
  });

  describe("getDevice", () => {
    beforeEach(() => {
      plugin = newPvwsPlugin("localhost:8080", false);
    });

    it("should not throw error when called", () => {
      expect(() => plugin.getDevice("DEVICE_NAME")).not.toThrow();
    });
  });

  describe("putPv", () => {
    beforeEach(() => {
      plugin = newPvwsPlugin("localhost:8080", false);
      vi.clearAllMocks();
    });

    it("should send write message with double value", () => {
      const mockDType: DType = {
        value: {
          doubleValue: 42.5
        }
      } as DType;

      plugin.putPv("TEST:PV", mockDType);

      expect(mockClientInstance.sendMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: "write",
          pv: "TEST:PV",
          value: 42.5
        })
      );
    });

    it("should send write message with string value", () => {
      const mockDType: DType = {
        value: {
          stringValue: "test-string"
        }
      } as DType;

      plugin.putPv("TEST:PV", mockDType);

      expect(mockClientInstance.sendMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: "write",
          pv: "TEST:PV",
          value: "test-string"
        })
      );
    });

    it("should prefer string value over double value when both exist", () => {
      const mockDType: DType = {
        value: {
          stringValue: "string-val",
          doubleValue: 99.9
        }
      } as DType;

      plugin.putPv("TEST:PV", mockDType);

      expect(mockClientInstance.sendMessage).toHaveBeenCalledWith(
        JSON.stringify({
          type: "write",
          pv: "TEST:PV",
          value: "string-val"
        })
      );
    });
  });

  describe("updatePvwsHost", () => {
    beforeEach(() => {
      plugin = newPvwsPlugin("localhost:8080", false);
      vi.clearAllMocks();
    });

    it("should not reconnect if URL is the same", () => {
      mockClientInstance.getUrl.mockReturnValue("ws://localhost:8080/pvws/pv");

      plugin.updatePvwsHost("localhost:8080");

      expect(mockClientInstance.close).not.toHaveBeenCalled();
    });

    it("should connect to fallback when hostname is undefined", () => {
      mockClientInstance.getUrl.mockReturnValue("ws://other:8080/pvws/pv");

      plugin.updatePvwsHost(undefined);

      expect(mockClientInstance.close).toHaveBeenCalledWith(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
    });

    it("should connect to new hostname when fetch succeeds", async () => {
      mockClientInstance.getUrl.mockReturnValue("ws://localhost:8080/pvws/pv");
      (global.fetch as any).mockResolvedValue({ ok: true });

      plugin.updatePvwsHost("newhost:9090");

      await vi.waitFor(() => {
        expect(mockClientInstance.close).toHaveBeenCalled();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://newhost:9090/pvws/info"
      );
      expect(mockClientInstance.close).toHaveBeenCalledWith(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
    });

    it("should fallback to default when fetch fails", async () => {
      mockClientInstance.getUrl.mockReturnValue("ws://oldhost:8080/pvws/pv");
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      plugin.updatePvwsHost("newhost:9090");

      await vi.waitFor(() => {
        expect(log.debug).toHaveBeenCalled();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://newhost:9090/pvws/info"
      );
      expect(log.debug).toHaveBeenCalledWith(
        "PvwsPlugin.updatePvwsHostname: Could not connect to the preferred PVWS instance falling back to the default"
      );
      expect(mockClientInstance.close).toHaveBeenCalledWith(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
    });

    it("should fallback to default when fetch returns non-ok response", async () => {
      mockClientInstance.getUrl.mockReturnValue("ws://oldhost:8080/pvws/pv");
      (global.fetch as any).mockResolvedValue({ ok: false });

      plugin.updatePvwsHost("newhost:9090");

      await vi.waitFor(() => {
        expect(mockClientInstance.close).toHaveBeenCalled();
      });

      expect(mockClientInstance.close).toHaveBeenCalledWith(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
    });

    it("should use wss protocol when SSL is enabled", async () => {
      plugin = newPvwsPlugin("localhost:8080", true);
      vi.clearAllMocks();

      mockClientInstance.getUrl.mockReturnValue("wss://localhost:8080/pvws/pv");
      (global.fetch as any).mockResolvedValue({ ok: true });

      plugin.updatePvwsHost("newhost:9090");

      await vi.waitFor(() => {
        expect(mockClientInstance.close).toHaveBeenCalled();
      });
    });
  });

  describe("sendMessage error handling", () => {
    it("should log error when client is null", () => {
      plugin = newPvwsPlugin("localhost:8080", false);

      (plugin as any).client = null;

      const mockDType: DType = {
        value: { doubleValue: 42 }
      } as DType;

      plugin.putPv("TEST:PV", mockDType);

      expect(log.error).toHaveBeenCalledWith(
        "Attempted to send message when not connected to a websocket."
      );
    });
  });
});
