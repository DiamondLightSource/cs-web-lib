import {
  combineReducers,
  configureStore,
  isPlainObject
} from "@reduxjs/toolkit";

import csReducer from "./csState";
import notificationsReducer from "./notificationsSlice";
import { connectionMiddleware } from "./connectionMiddleware";
import { throttleMiddleware, UpdateThrottle } from "./throttleMiddleware";
import { Connection } from "../connection/plugin";
import { SimulatorPlugin } from "../connection/sim";
import { PvwsPlugin } from "../connection/pvws";
import { ConnectionForwarder } from "../connection/forwarder";

export type CsWebLibConfig = {
  storeMode: "DEV" | "PROD" | undefined;
  PVWS_SOCKET: string | undefined;
  PVWS_SSL: boolean | undefined;
  THROTTLE_PERIOD: number | undefined;
};

// Store singleton
let storeInstance: ReturnType<typeof configureStore> | null = null;

const buildConnection = (config?: CsWebLibConfig): Connection => {
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

export const rootReducer = combineReducers({
  cs: csReducer,
  notifications: notificationsReducer
});

const createStoreInstance = (config?: CsWebLibConfig) => {
  const isDevMode = config?.storeMode === "DEV";

  return configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => {
      const mw = getDefaultMiddleware({
        immutableCheck: isDevMode,
        serializableCheck: !isDevMode
          ? false
          : {
              isSerializable: (value: any) =>
                value === null ||
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean" ||
                Array.isArray(value) ||
                isPlainObject(value) ||
                // allow all typed arrays and undefined
                ArrayBuffer.isView(value) ||
                value === undefined
            }
      });

      return mw
        .concat(connectionMiddleware(buildConnection(config)))
        .concat(
          throttleMiddleware(
            new UpdateThrottle(
              parseFloat(
                config?.THROTTLE_PERIOD ??
                  process.env.VITE_THROTTLE_PERIOD ??
                  import.meta.env.VITE_THROTTLE_PERIOD ??
                  "100"
              )
            )
          )
        );
    },
    devTools: isDevMode
  });
};

export const store = (config?: CsWebLibConfig) => {
  if (!storeInstance) {
    storeInstance = createStoreInstance(config);
  }
  return storeInstance;
};

// Reset store (for testing)
export const resetStore = () => {
  storeInstance = null;
};
