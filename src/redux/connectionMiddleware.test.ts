import { connectionMiddleware } from "./connectionMiddleware";
import { createRootStoreState, ddouble } from "../testResources";
import { newDType } from "../types/dtypes";
import { vi } from "vitest";
import { initialCsState, queryDevice, subscribe, writePv } from "./csState";
import { CsWebLibConfig } from "./csWebLibConfig";

const mockStore = { dispatch: vi.fn(), getState: vi.fn() };

vi.mock("../connection/serviceConnection", () => {
  const subscribe = vi.fn();
  const putPv = vi.fn();
  const getDevice = vi.fn();
  const mockConnection = vi.fn(() => ({
    subscribe,
    unsubscribe: vi.fn(),
    putPv,
    getDevice
  }));

  return {
    buildServiceConnection: vi.fn(),
    updatePvwsHostname: vi.fn(),
    getServiceConnection: mockConnection,
    __subscribe: subscribe,
    __putPv: putPv,
    __getDevice: getDevice
  };
});

const config: CsWebLibConfig = {
  PVWS_SOCKET: "SomeSocket",
  PVWS_SSL: true,
  storeMode: "DEV",
  THROTTLE_PERIOD: 100,
  featureFlags: {
    enableDynamicScripts: false
  }
};

let mockSubscribe: any;
let mockPutPv: any;
let mockGetDevice: any;

describe("connectionMiddleware", (): void => {
  beforeEach(async (): Promise<void> => {
    vi.clearAllMocks();

    const mod = await vi.importMock("../connection/serviceConnection");
    mockSubscribe = mod.__subscribe;
    mockPutPv = mod.__putPv;
    mockGetDevice = mod.__getDevice;
  });

  it("calls subscribe() when receiving Subscribe", (): void => {
    const middleware = connectionMiddleware(config);
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
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    // The action is passed on.
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0].type).toEqual("cs/subscribe");
  });

  it("calls putPv() when receiving WritePv", (): void => {
    // Set up state
    mockStore.getState.mockReturnValue(
      createRootStoreState({ ...initialCsState, effectivePvNameMap: {} })
    );
    const middleware = connectionMiddleware(config);
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
    expect(mockPutPv).toHaveBeenCalledTimes(1);
    // The action is passed on.
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0].type).toEqual("cs/writePv");
  });

  it("calls getDevice() when receiving query device", (): void => {
    mockStore.getState.mockReturnValue(
      createRootStoreState({ ...initialCsState, deviceCache: {} })
    );
    const middleware = connectionMiddleware(config);
    const nextHandler = middleware(mockStore);
    const mockNext = vi.fn();
    const actionHandler = nextHandler(mockNext);
    const queryAction: ReturnType<typeof queryDevice> = {
      type: "cs/queryDevice",
      payload: { device: "dev://device" }
    };
    actionHandler(queryAction);
    expect(mockGetDevice).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0].type).toEqual("cs/queryDevice");
  });

  it("doesn't query when the current device is in cache", (): void => {
    mockStore.getState.mockReturnValue(
      createRootStoreState({
        ...initialCsState,
        deviceCache: { testDevice: newDType({ stringValue: "42" }) }
      })
    );
    const middleware = connectionMiddleware(config);
    const nextHandler = middleware(mockStore);
    const mockNext = vi.fn();
    const actionHandler = nextHandler(mockNext);
    const queryAction: ReturnType<typeof queryDevice> = {
      type: "cs/queryDevice",
      payload: { device: "testDevice" }
    };
    actionHandler(queryAction);
    expect(mockGetDevice).toHaveBeenCalledTimes(0);
  });
});
