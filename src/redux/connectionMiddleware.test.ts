import { connectionMiddleware } from "./connectionMiddleware";
import { ddouble } from "../testResources";
import { newDType } from "../types/dtypes/dType";
import { vi } from "vitest";
import { queryDevice, subscribe, writePv } from "./csState";

const mockStore = { dispatch: vi.fn(), getState: vi.fn() };

const mockConnection = {
  subscribe: vi.fn(),
  putPv: vi.fn(),
  connect: vi.fn(),
  isConnected: vi.fn(),
  unsubscribe: vi.fn(),
  getDevice: vi.fn()
};

describe("connectionMiddleware", (): void => {
  beforeEach((): void => {
    mockConnection.subscribe.mockClear();
    mockConnection.connect.mockClear();
    mockConnection.putPv.mockClear();
    mockStore.dispatch.mockClear();
    mockConnection.getDevice.mockClear();
  });
  it("calls subscribe() when receiving Subscribe", (): void => {
    const middleware = connectionMiddleware(mockConnection);
    // nextHandler takes next() and returns the actual middleware function
    const nextHandler = middleware(mockStore);
    const mockNext = vi.fn();
    // actionHandler takes an action
    const actionHandler = nextHandler(mockNext);

    const subscribeAction: ReturnType<typeof subscribe> = {
      type: "cs/subscribe",
      payload: {
        pvName: "pv",
        componentId: "2",
        effectivePvName: "pv",
        type: { double: true }
      }
    };
    actionHandler(subscribeAction);
    expect(mockConnection.subscribe).toHaveBeenCalledTimes(1);
    // The action is passed on.
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0].type).toEqual("cs/subscribe");
  });

  it("calls putPv() when receiving WritePv", (): void => {
    // Set up state
    mockStore.getState.mockReturnValue({ effectivePvNameMap: {} });
    const middleware = connectionMiddleware(mockConnection);
    // nextHandler takes next() and returns the actual middleware function
    const nextHandler = middleware(mockStore);
    const mockNext = vi.fn();
    // actionHandler takes an action
    const actionHandler = nextHandler(mockNext);

    const writeAction: ReturnType<typeof writePv> = {
      type: "cs/writePv",
      payload: { pvName: "pv", value: ddouble(0) }
    };

    actionHandler(writeAction);
    expect(mockConnection.putPv).toHaveBeenCalledTimes(1);
    // The action is passed on.
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0].type).toEqual("cs/writePv");
  });

  it("calls getDevice() when receiving query device", (): void => {
    mockStore.getState.mockReturnValue({ deviceCache: {} });
    const middleware = connectionMiddleware(mockConnection);
    const nextHandler = middleware(mockStore);
    const mockNext = vi.fn();
    const actionHandler = nextHandler(mockNext);
    const queryAction: ReturnType<typeof queryDevice> = {
      type: "cs/queryDevice",
      payload: { device: "dev://device" }
    };
    actionHandler(queryAction);
    expect(mockConnection.getDevice).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0].type).toEqual("cs/queryDevice");
  });

  it("doesn't query when the current device is in cache", (): void => {
    mockStore.getState.mockReturnValue({
      deviceCache: { testDevice: newDType({ stringValue: "42" }) }
    });
    const middleware = connectionMiddleware(mockConnection);
    const nextHandler = middleware(mockStore);
    const mockNext = vi.fn();
    const actionHandler = nextHandler(mockNext);
    const queryAction: ReturnType<typeof queryDevice> = {
      type: "cs/queryDevice",
      payload: { device: "testDevice" }
    };
    actionHandler(queryAction);
    expect(mockConnection.getDevice).toHaveBeenCalledTimes(0);
  });
});
