import { describe, it, expect, vi, beforeEach } from "vitest";
import WS from "vitest-websocket-mock";
import {
  CLOSE_SOCKET_FOR_SERVICE_SWITCH,
  HEARTBEAT_INTERVAL_SECONDS,
  PvwsClient,
  RECONNECT_MILLISECONDS
} from "./pvwsClient";

import { pvwsToDType } from "./pvwsToDType";
import log from "loglevel";

vi.mock("../pvwsToDType", () => ({
  pvwsToDType: vi.fn().mockReturnValue("converted")
}));

// Spy on loglevel
vi.spyOn(log, "error");

const onErrorMessageCallback = vi.fn();
const onValueChangedCallback = vi.fn();
const onConnectionChangedCallback = vi.fn();
const onConnectionClosedCallback = vi.fn();

const newPvwsClient = (): PvwsClient =>
  new PvwsClient(
    "ws://test",
    onConnectionChangedCallback,
    onValueChangedCallback,
    onConnectionClosedCallback,
    onErrorMessageCallback
  );

describe.sequential("PvwsClient with vitest-websocket-mock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WS.clean(); // reset all WebSocket servers
  });

  it("sends heartbeat subscription on connect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();

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

    const client = newPvwsClient();
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

    const client = newPvwsClient();
    await server.connected;

    await server.send(message);

    expect(onConnectionChangedCallback).toHaveBeenCalledWith("X", true, false);
    expect(onValueChangedCallback).toHaveBeenCalledWith("X", processedMessage);

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

    const client = newPvwsClient();
    await server.connected;

    await server.send(errorMessage);

    expect(onErrorMessageCallback).toHaveBeenCalledWith("Connection timeout");

    expect(logErrorSpy).toHaveBeenCalledWith(
      "PVWS error message: Connection timeout"
    );

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();

    logErrorSpy.mockRestore();
  });

  it("handles close + reconnect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();

    await server.connected;
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close(); // triggers onclose
    expect(client.connectionState()).toBeGreaterThanOrEqual(WebSocket.CLOSING);
    await server.connected;

    await new Promise(resolve =>
      setTimeout(resolve, RECONNECT_MILLISECONDS + 20)
    );
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("handles close + not reconnect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();

    await server.connected;
    expect(client.connectionState()).toBe(WebSocket.OPEN);

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");

    expect(client.connectionState()).toBeGreaterThanOrEqual(WebSocket.CLOSING);

    await new Promise(resolve =>
      setTimeout(resolve, RECONNECT_MILLISECONDS + 20)
    );
    expect(client.connectionState()).toBe(WebSocket.CLOSED);

    server.close();
  });

  it("handles close + reconnect + resubscribe", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();

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

    const client = newPvwsClient();
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

    expect(onConnectionClosedCallback).toHaveBeenCalledWith("sim://foo");

    server.close();
    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
  });
});
