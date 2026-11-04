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

const clients: PvwsClient[] = [];

const newPvwsClient = (cachePreservePeriod?: number): PvwsClient => {
  const c = new PvwsClient(
    "ws://test",
    onConnectionChangedCallback,
    onValueChangedCallback,
    onConnectionClosedCallback,
    onErrorMessageCallback,
    cachePreservePeriod
  );
  clients.push(c);
  return c;
};

const heartbeat = {
  type: "subscribe",
  pvs: [`sim://flipflop(${HEARTBEAT_INTERVAL_SECONDS})`]
};
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe.sequential("PvwsClient with vitest-websocket-mock", () => {
  afterEach(() => {
    clients
      .splice(0)
      .forEach(c => c.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up"));
  });
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

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("handles close + reconnect + resubscribe", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();

    await server.connected;
    expect(await server.nextMessage).toEqual(heartbeat);

    client.subscribe("sim://foo");
    expect(await server.nextMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://foo"]
    });

    expect(client.connectionState()).toBe(WebSocket.OPEN);
    client.close(); // server-side style drop: reconnects after RECONNECT_MILLISECONDS

    expect(await server.nextMessage).toEqual(heartbeat);
    expect(await server.nextMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://foo"]
    });

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });
  it("does not reconnect after being closed for a service switch", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();
    await server.connected;

    client.close(); // schedules a reconnect
    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "switch");
    await sleep(RECONNECT_MILLISECONDS + 100);

    expect(client.connectionState()).toBe(WebSocket.CLOSED);
    server.close();
  });

  it("unsubscribe sends clear, then calls the closed callback on the next tick", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();
    await server.connected;
    await server.nextMessage; // heartbeat

    client.subscribe("sim://foo");
    expect(await server.nextMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://foo"]
    });

    client.unsubscribe("sim://foo");
    // Deferred, so that the reducer has removed the subscriber first
    expect(onConnectionClosedCallback).not.toHaveBeenCalled();
    expect(await server.nextMessage).toEqual({
      type: "clear",
      pvs: ["sim://foo"]
    });
    await vi.waitFor(() =>
      expect(onConnectionClosedCallback).toHaveBeenCalledWith("sim://foo")
    );

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });
  it("only fires connectionChanged on the first update or when readonly changes", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();
    await server.connected;

    await server.send({ type: "update", pv: "X", readonly: false });
    await server.send({ type: "update", pv: "X", readonly: false });
    expect(onConnectionChangedCallback).toHaveBeenCalledTimes(1);
    expect(onValueChangedCallback).toHaveBeenCalledTimes(2);

    await server.send({ type: "update", pv: "X", readonly: true });
    expect(onConnectionChangedCallback).toHaveBeenCalledTimes(2);
    expect(onConnectionChangedCallback).toHaveBeenLastCalledWith(
      "X",
      true,
      true
    );

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("marks subscribed PVs disconnected on close and re-notifies after reconnect", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();
    await server.connected;
    client.subscribe("X");
    await server.send({ type: "update", pv: "X", readonly: false });

    client.close();
    await vi.waitFor(() =>
      expect(onConnectionChangedCallback).toHaveBeenCalledWith("X", false, true)
    );

    await vi.waitFor(
      () => expect(client.connectionState()).toBe(WebSocket.OPEN),
      { timeout: 2000 }
    );
    onConnectionChangedCallback.mockClear();
    await server.send({ type: "update", pv: "X", readonly: false });
    expect(onConnectionChangedCallback).toHaveBeenCalledWith("X", true, false);

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("batches subscribes made in the same tick into one message", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();
    await server.connected;
    await server.nextMessage; // heartbeat

    client.subscribe("sim://a");
    client.subscribe("sim://b");
    expect(await server.nextMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://a", "sim://b"]
    });

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  it("unsubscribing before the batch flushes sends nothing for that PV", async () => {
    const server = new WS("ws://test", { jsonProtocol: true });
    const client = newPvwsClient();
    await server.connected;
    await server.nextMessage; // heartbeat

    client.subscribe("sim://a");
    client.unsubscribe("sim://a");
    client.subscribe("sim://b");
    // The next message must be b's: no subscribe and no clear for a
    expect(await server.nextMessage).toEqual({
      type: "subscribe",
      pvs: ["sim://b"]
    });

    client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
    server.close();
  });

  describe("cache preserve window", () => {
    it("delays the closed callback by cachePreservePeriod", async () => {
      const server = new WS("ws://test", { jsonProtocol: true });
      const client = newPvwsClient(100);
      await server.connected;
      client.subscribe("sim://foo");
      await sleep(0);

      client.unsubscribe("sim://foo");
      await sleep(50);
      expect(onConnectionClosedCallback).not.toHaveBeenCalled();
      await vi.waitFor(
        () =>
          expect(onConnectionClosedCallback).toHaveBeenCalledWith("sim://foo"),
        { timeout: 500 }
      );

      client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
      server.close();
    });

    it("resubscribing inside the window cancels the callback", async () => {
      const server = new WS("ws://test", { jsonProtocol: true });
      const client = newPvwsClient(100);
      await server.connected;
      client.subscribe("sim://foo");
      await sleep(0);

      client.unsubscribe("sim://foo");
      client.subscribe("sim://foo");
      await sleep(200);
      expect(onConnectionClosedCallback).not.toHaveBeenCalled();

      client.close(CLOSE_SOCKET_FOR_SERVICE_SWITCH, "Clean up");
      server.close();
    });
  });
});
