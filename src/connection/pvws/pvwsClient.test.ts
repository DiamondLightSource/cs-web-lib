import { describe, it, expect, vi, beforeEach } from "vitest";
import WS from "vitest-websocket-mock";
import {
  CLOSE_SOCKET_FOR_SERVICE_SWITCH,
  HEARTBEAT_INTERVAL_SECONDS,
  PvwsClient,
  RECONNECT_MILLISECONDS
} from "./pvwsClient";

import {
  connectionChanged,
  connectionClosed,
  valueChanged
} from "../../redux/csState";
import { pvwsToDType } from "./pvwsToDType";
import log from "loglevel";

// mock notification dispatcher
vi.mock("../../redux/notificationUtils", () => ({
  notificationDispatcher: () => ({
    showError: vi.fn()
  })
}));

vi.mock("../pvwsToDType", () => ({
  pvwsToDType: vi.fn().mockReturnValue("converted")
}));

// Spy on loglevel
vi.spyOn(log, "error");

let mockDispatch = vi.fn();

describe.sequential("PvwsClient with vitest-websocket-mock", () => {
  beforeEach(() => {
    mockDispatch = vi.fn();
    vi.clearAllMocks();
    WS.clean(); // reset all WebSocket servers
  });

  it("sends heartbeat subscription on connect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = new PvwsClient("ws://test", mockDispatch);

    const serverIncomingFlipFlop = await server.nextMessage;

    expect(serverIncomingFlipFlop).toEqual({
      type: "subscribe",
      pvs: [`sim://flipflop(${HEARTBEAT_INTERVAL_SECONDS})`]
    });

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("sends subscription message to server", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });

    const client = new PvwsClient("ws://test", mockDispatch);
    await server.connected;
    client.subscribe("sim://foo");

    await server.nextMessage;
    const serverIncomingMessage = await server.nextMessage;

    expect(serverIncomingMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://foo"]
    });

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("handles 'update' messages", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const message = { type: "update", pv: "X", readonly: false };
    const processedMessage = pvwsToDType(message);

    const client = new PvwsClient("ws://test", mockDispatch);
    await server.connected;

    await server.send(message);

    expect(mockDispatch).toHaveBeenCalledWith(
      connectionChanged({
        pvName: "X",
        value: { isConnected: true, isReadonly: false }
      })
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      valueChanged({ pvName: "X", value: processedMessage })
    );

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("handles 'error' messages from server", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const errorMessage = {
      type: "error",
      message: "Connection timeout"
    };

    // Spy on log.error
    const logErrorSpy = vi.spyOn(log, "error");

    const client = new PvwsClient("ws://test", mockDispatch);
    await server.connected;

    await server.send(errorMessage);

    expect(logErrorSpy).toHaveBeenCalledWith(
      "PVWS error message: Connection timeout"
    );

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();

    logErrorSpy.mockRestore();
  });

  it("handles close + reconnect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = new PvwsClient("ws://test", mockDispatch);

    await server.connected;
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close(); // triggers onclose
    expect(client.connectionState()).toBeGreaterThanOrEqual(WebSocket.CLOSING);
    await server.connected;

    await new Promise(resolve =>
      setTimeout(resolve, RECONNECT_MILLISECONDS + 10)
    );
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("handles close + not reconnect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = new PvwsClient("ws://test", mockDispatch);

    await server.connected;
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");

    expect(client.connectionState()).toBeGreaterThanOrEqual(WebSocket.CLOSING);

    await new Promise(resolve =>
      setTimeout(resolve, RECONNECT_MILLISECONDS + 10)
    );
    expect(client.connectionState()).toBe(WebSocket.CLOSED);

    server.close();
  });

  it("handles close + reconnect + resubscribe", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = new PvwsClient("ws://test", mockDispatch);

    await server.connected;

    client.subscribe("sim://foo");
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close();
    expect(client.connectionState()).toBeGreaterThanOrEqual(WebSocket.CLOSING);

    await server.connected;

    const resubscribeFlipFlop = await server.nextMessage;
    const resubscribe = await server.nextMessage;

    expect(resubscribeFlipFlop).toEqual({
      type: "subscribe",
      pvs: ["sim://flipflop(29.929)"]
    });

    expect(resubscribe).toEqual({
      type: "subscribe",
      pvs: ["sim://foo"]
    });

    server.close();
    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
  });

  it("unsubscribe sends clear and dispatches connectionClosed", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });

    const client = new PvwsClient("ws://test", mockDispatch);
    await server.connected;

    client.subscribe("sim://foo");
    client.unsubscribe("sim://foo");

    await server.nextMessage;
    const serverIncomingSubscribeMessage = await server.nextMessage;
    const serverIncomingClearMessage = await server.nextMessage;

    // "clear" message:
    expect(serverIncomingSubscribeMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://foo"]
    });
    expect(serverIncomingClearMessage).toEqual({
      type: "clear",
      pvs: ["sim://foo"]
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      connectionClosed({ pvName: "sim://foo" })
    );

    server.close();
    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
  });
});
