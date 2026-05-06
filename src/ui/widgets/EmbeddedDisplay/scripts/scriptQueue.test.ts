import { describe, test, expect, beforeEach, vi } from "vitest";
import { enqueueScript, executeAllScriptsInQueue } from "./scriptQueue";

import { ScriptResponse } from "./scriptTypes";

const pvMock = [{ number: 1, string: "a" }];

const flushPromises = async () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

describe("script queue", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("adds item to queue when under limit", () => {
    const resolve = vi.fn();
    const reject = vi.fn();

    enqueueScript("code", pvMock, resolve, reject);

    const execMock = vi.fn().mockResolvedValue({
      functionReturnValue: 123,
      widgetProps: {}
    });

    executeAllScriptsInQueue(execMock);

    expect(execMock).toHaveBeenCalledWith("code", pvMock);
  });

  test("resolves queued items", async () => {
    const resolve = vi.fn();
    const reject = vi.fn();

    const response: ScriptResponse = {
      functionReturnValue: 42,
      widgetProps: { a: 1 }
    };

    enqueueScript("code", pvMock, resolve, reject);

    const execMock = vi.fn().mockResolvedValue(response);

    executeAllScriptsInQueue(execMock);

    await flushPromises();

    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  test("rejects queued items when execution fails", async () => {
    const resolve = vi.fn();
    const reject = vi.fn();

    enqueueScript("code", pvMock, resolve, reject);

    const execMock = vi.fn().mockRejectedValue(new Error("fail"));

    executeAllScriptsInQueue(execMock);

    await flushPromises();

    expect(reject).toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  });

  test("empties the queue after execution", () => {
    const resolve = vi.fn();
    const reject = vi.fn();

    enqueueScript("code", pvMock, resolve, reject);

    const execMock = vi.fn().mockResolvedValue({
      functionReturnValue: 1,
      widgetProps: {}
    });

    executeAllScriptsInQueue(execMock);
    executeAllScriptsInQueue(execMock);

    expect(execMock).toHaveBeenCalledTimes(1);
  });

  test("rejects when queue exceeds limit", () => {
    for (let i = 0; i < 200; i++) {
      enqueueScript("code", pvMock, vi.fn(), vi.fn());
    }

    const reject = vi.fn();
    enqueueScript("overflow", pvMock, vi.fn(), reject);

    expect(reject).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("queue is full")
      })
    );
  });
});
