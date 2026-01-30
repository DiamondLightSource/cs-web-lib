import { configureStore } from "@reduxjs/toolkit";

import { csReducer } from "./csState";
import { connectionMiddleware } from "./connectionMiddleware";
import { throttleMiddleware, UpdateThrottle } from "./throttleMiddleware";
import { Connection } from "../connection/plugin";
import { SimulatorPlugin } from "../connection/sim";
import { PvwsPlugin } from "../connection/pvws";
import { ConnectionForwarder } from "../connection/forwarder";

export type CsWebLibConfig = {
  PVWS_SOCKET: string | undefined;
  PVWS_SSL: boolean | undefined;
  THROTTLE_PERIOD: number | undefined;
};

// Store singleton
let storeInstance: ReturnType<typeof configureStore> | null = null;
let connectionInstance: ConnectionForwarder | null = null;

const buildConnection = (config?: CsWebLibConfig) => {
  const PVWS_SOCKET =
    config?.PVWS_SOCKET ??
    process.env.VITE_PVWS_SOCKET ??
    import.meta.env.VITE_PVWS_SOCKET;
  const PVWS_SSL = !!(
    config?.PVWS_SSL ??
    (process.env.VITE_PVWS_SSL ?? import.meta.env.VITE_PVWS_SSL) === "true"
  );

  const simulator = new SimulatorPlugin();
  const plugins: [string, Connection][] = [["sim://", simulator]];

  if (PVWS_SOCKET !== undefined) {
    const pvws = new PvwsPlugin(PVWS_SOCKET, PVWS_SSL);
    plugins.unshift(["pva://", pvws]);
    plugins.unshift(["ca://", pvws]);
    plugins.unshift(["loc://", pvws]);
    plugins.unshift(["sim://", pvws]);
    plugins.unshift(["ssim://", pvws]);
    plugins.unshift(["dev://", pvws]);
    plugins.unshift(["eq://", pvws]);
  }

  return new ConnectionForwarder(plugins);
};

export const store = (config?: CsWebLibConfig) => {
  if (storeInstance) {
    return storeInstance;
  }

  if (!connectionInstance) {
    connectionInstance = buildConnection(config);
  }

  const THROTTLE_PERIOD: number = parseFloat(
    config?.THROTTLE_PERIOD ??
      process.env.VITE_THROTTLE_PERIOD ??
      import.meta.env.VITE_THROTTLE_PERIOD ??
      "100"
  );

  storeInstance = configureStore({
    reducer: csReducer,
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware().concat(
        connectionMiddleware(connectionInstance),
        throttleMiddleware(new UpdateThrottle(THROTTLE_PERIOD))
      ),
    devTools: true, // This replaces the Redux DevTools Extension setup
  });

  return storeInstance;
};

// Reset store (for testing)
export const resetStore = () => {
  storeInstance = null;
  connectionInstance = null;
};