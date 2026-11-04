import { connectionMiddleware } from "./connectionMiddleware";
import { createRootStoreState, ddouble } from "../testResources";
import { newDType } from "../types/dtypes";
import { vi } from "vitest";
import { initialCsState, queryDevice, subscribe, writePv } from "./csState";
import { CsWebLibConfig } from "./csWebLibConfig";

const mockStore = { dispatch: vi.fn(), getState: vi.fn() };

vi.mock("../connection/serviceConnection", () => {
  const subscribe = vi.fn();
  const unsubscribe = vi.fn();
  const putPv = vi.fn();
  const getDevice = vi.fn();
  const mockConnection = vi.fn(() => ({
    subscribe,
    unsubscribe,
    putPv,
    getDevice
  }));

  return {
    buildServiceConnection: vi.fn(),
    updatePvwsHostname: vi.fn(),
    getServiceConnection: mockConnection,
    __subscribe: subscribe,
    __unsubscribe: unsubscribe,
    __putPv: putPv,
    __getDevice: getDevice
  };
});

const config: CsWebLibConfig = {
  PVWS_SOCKET: "SomeSocket",
  PVWS_SSL: true,
  storeMode: "DEV",
  THROTTLE_PERIOD: 100,
  defaultMjpgEndpoint: "",
  csWebLibFeatureFlags: {
    enableDynamicScripts: false
  }
};

let mockSubscribe: any;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mockUnsubscribe: any;
let mockPutPv: any;
let mockGetDevice: any;

describe("connectionMiddleware", (): void => {
  beforeEach(async (): Promise<void> => {
    vi.clearAllMocks();

    const mod = await vi.importMock("../connection/serviceConnection");
    mockSubscribe = mod.__subscribe;
    mockPutPv = mod.__putPv;
    mockGetDevice = mod.__getDevice;
    mockUnsubscribe = mod.__unsubscribe;
  });

  const run = (action: any) => {
    const mockNext = vi.fn();
    connectionMiddleware(config)(mockStore)(mockNext)(action);
    return mockNext;
  };

  describe("subscribe", () => {
    it("injects the effective PV name returned by the connection", () => {
      mockSubscribe.mockReturnValueOnce("effective");
      const mockNext = run(
        subscribe({ pvName: "pv(1)", componentId: "1", type: { double: true } })
      );
      expect(mockNext.mock.calls[0][0].payload.effectivePvName).toBe(
        "effective"
      );
    });

    it("still forwards the action if subscribing throws", () => {
      mockSubscribe.mockImplementationOnce(() => {
        throw new Error("boom");
      });
      const mockNext = run(
        subscribe({ pvName: "pv", componentId: "1", type: { double: true } })
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0].payload.effectivePvName).toBe("pv");
    });

    it("preserves the auto-batch meta on the forwarded action", () => {
      const action = subscribe({ pvName: "pv", componentId: "1", type: {} });
      const mockNext = run(action);
      expect(mockNext.mock.calls[0][0].meta).toEqual(action.meta);
    });
    it("calls subscribe() when receiving Subscribe", (): void => {
      const middleware = connectionMiddleware(config);
      // nextHandler takes next() and returns the actual middleware function
      const nextHandler = middleware(mockStore);
      const mockNext = vi.fn();
      // actionHandler takes an action
      const actionHandler = nextHandler(mockNext);

      const subscribeAction = subscribe({
        pvName: "pv",
        componentId: "2",
        effectivePvName: "pv",
        type: { double: true }
      });
      actionHandler(subscribeAction);
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
      // The action is passed on.
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0].type).toEqual("cs/subscribe");
    });
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
