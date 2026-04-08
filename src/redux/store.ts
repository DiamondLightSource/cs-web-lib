import {
  combineReducers,
  configureStore,
  isPlainObject
} from "@reduxjs/toolkit";

import csReducer from "./csState";
import notificationsReducer from "./slices/notificationsSlice";
import configurationReducer from "./slices/configurationSlice";
import { connectionMiddleware } from "./connectionMiddleware";
import { throttleMiddleware, UpdateThrottle } from "./throttleMiddleware";
import { CsWebLibConfig } from "./csWebLibConfig";

// Store singleton
let storeInstance: ReturnType<typeof configureStore> | null = null;

export const rootReducer = combineReducers({
  configuration: configurationReducer,
  cs: csReducer,
  notifications: notificationsReducer
});

const createStoreInstance = (config?: CsWebLibConfig) => {
  const isDevMode = config?.storeMode === "DEV";

  return configureStore({
    reducer: rootReducer,
    preloadedState: {
      configuration: config
    },
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
        .concat(connectionMiddleware(config))
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
