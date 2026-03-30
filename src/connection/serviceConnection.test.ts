import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { connectionChanged, valueChanged } from "../redux/csState";
import {
  buildServiceConnection,
  clearStateForTests,
  getServiceConnection,
  updatePvwsHostname
} from "./serviceConnection";
import { CsWebLibConfig } from "../redux";
import { newDType } from "../types/dtypes";

const {
  mockSimulatorConnect,
  mockPvwsUpdateHost,
  MockSimulatorPlugin,
  MockPvwsPlugin
} = vi.hoisted(() => ({
  mockSimulatorConnect: vi.fn(),
  mockPvwsUpdateHost: vi.fn(),
  MockSimulatorPlugin: vi.fn(function (this: any) {
    this.connect = mockSimulatorConnect;
  }),
  MockPvwsPlugin: vi.fn(function (this: any) {
    this.updatePvwsHost = mockPvwsUpdateHost;
  })
}));

vi.mock("./forwarder", () => ({
  ConnectionForwarder: vi.fn(function (this: any, plugins: any) {
    this.plugins = plugins;
  })
}));

vi.mock("./sim", () => ({
  SimulatorPlugin: MockSimulatorPlugin
}));

vi.mock("./pvws/pvwsPlugin", () => ({
  PvwsPlugin: MockPvwsPlugin
}));

vi.mock("./redux/notificationUtils", () => ({
  notificationDispatcher: () => ({ showError: vi.fn() })
}));

const config: CsWebLibConfig = {
  PVWS_SOCKET: "SomeSocket",
  PVWS_SSL: true,
  storeMode: "DEV",
  THROTTLE_PERIOD: 100
};

describe("buildServiceConnection", () => {
  let dispatch: Mock;

  beforeEach(() => {
    clearStateForTests();
    vi.clearAllMocks();
    dispatch = vi.fn();
  });

  it("creates a connection once (singleton)", () => {
    buildServiceConnection(dispatch);
    const conn1 = getServiceConnection();

    buildServiceConnection(dispatch);
    const conn2 = getServiceConnection();

    expect(conn1).toBe(conn2);
  });

  it("throws if getServiceConnection called before buildServiceConnection", () => {
    expect(() => getServiceConnection()).toThrowError(
      /does not exist, cannot contact the server/
    );
  });

  it("initialises simulator plugin and dispatches connection + value handlers", () => {
    buildServiceConnection(dispatch);

    expect(mockSimulatorConnect).toHaveBeenCalledTimes(1);
    const [onConnChanged, onValueChanged] = mockSimulatorConnect.mock.calls[0];

    // Simulate callbacks
    onConnChanged("pv1", { isConnected: true, isReadonly: false });
    onValueChanged("pv1", newDType({ doubleValue: 123 }));

    expect(dispatch).toHaveBeenCalledWith(
      connectionChanged({
        pvName: "pv1",
        value: { isConnected: true, isReadonly: false }
      })
    );
    expect(dispatch).toHaveBeenCalledWith(
      valueChanged({ pvName: "pv1", value: newDType({ doubleValue: 123 }) })
    );
  });

  it("initialises PvwsPlugin when PVWS_SOCKET is set", async () => {
    // Simulate environment variable
    vi.stubEnv("VITE_PVWS_SOCKET", "ws://dummy");

    buildServiceConnection(dispatch);

    const mockedPvwsModule = await vi.importMock("./pvws/pvwsPlugin");
    expect(mockedPvwsModule.PvwsPlugin).toHaveBeenCalledTimes(1);
  });

  it("does not create PvwsPlugin when PVWS_SOCKET undefined", async () => {
    vi.stubEnv("VITE_PVWS_SOCKET", "");

    buildServiceConnection(dispatch);

    const mockedPvwsModule = await vi.importMock("./pvws/pvwsPlugin");
    expect(mockedPvwsModule.PvwsPlugin).not.toHaveBeenCalled();
  });
});

describe("updatePvwsHostname", () => {
  beforeEach(() => {
    clearStateForTests();
    vi.clearAllMocks();
  });

  it("forwards hostname update to pvwsConnection", () => {
    vi.stubEnv("VITE_PVWS_SOCKET", "ws://dummy");

    buildServiceConnection(vi.fn(), config);

    updatePvwsHostname("new-host");

    expect(mockPvwsUpdateHost).toHaveBeenCalledWith("new-host");
  });
});
