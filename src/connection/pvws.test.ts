import { PvwsPlugin } from "./pvws";
import WS from "vitest-websocket-mock";
import { DType } from "../types/dtypes";

describe("PvwsPlugin", (): void => {
  let cp: PvwsPlugin;
  let mockConnUpdate: jest.Mock;
  let mockValUpdate: jest.Mock;
  let ws: WS;
  beforeEach(async () => {
    ws = new WS("ws://a.b.c:100/pvws/pv");
    cp = new PvwsPlugin("a.b.c:100", false);
    mockConnUpdate = jest.fn();
    mockValUpdate = jest.fn();
    cp.connect(mockConnUpdate, mockValUpdate);
    await ws.connected;
  });
  afterEach(() => {
    WS.clean();
  });

  it("handles update to value", (): void => {
    cp.subscribe("hello", { string: true });
    ws.send(JSON.stringify({ type: "update", pv: "hello", value: 42 }));
    expect(mockValUpdate).toHaveBeenCalledWith(
      "hello",
      new DType(
        {
          stringValue: "42",
          doubleValue: 42,
          arrayValue: undefined
        },
        undefined,
        undefined,
        undefined,
        true
      )
    );
  });

  it("handles update to array value", (): void => {
    cp.subscribe("hello", { string: true });
    ws.send(
      JSON.stringify({
        type: "update",
        pv: "hello",
        b64int: "AAAAAAEAAAACAAAA"
      })
    );
    expect(mockValUpdate).toHaveBeenCalledWith(
      "hello",
      new DType(
        {
          arrayValue: Int32Array.from([0, 1, 2]),
          stringValue: undefined,
          doubleValue: undefined
        },
        undefined,
        undefined,
        undefined,
        true
      )
    );
  });

  it("handles update to time", (): void => {
    cp.subscribe("hello", { string: true });
    ws.send(
      JSON.stringify({ type: "update", pv: "hello", seconds: "1483272000" })
    );
    const calls = mockValUpdate.mock.calls;
    expect(calls.length).toBe(1);
    const [pv, value] = mockValUpdate.mock.calls[0];
    expect(pv).toBe("hello");
    expect(value.time?.datetime?.getFullYear()).toBe(2017);
  });

  it("unsubscribes_with_no_errors", (): void => {
    expect(() => cp.unsubscribe("hello")).not.toThrow(TypeError);
  });
});
