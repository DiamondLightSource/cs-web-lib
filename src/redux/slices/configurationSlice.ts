import { createSlice } from "@reduxjs/toolkit";
import { CsWebLibConfig } from "../csWebLibConfig";

/**
 * This reducer is intended to be initialized via `preloadedState`.
 * The initialState here exists only as a type-safe fallback.
 */
const initialState: CsWebLibConfig = {
  storeMode: "DEV",
  PVWS_SOCKET: "",
  PVWS_SSL: true,
  THROTTLE_PERIOD: 100,
  defaultMjpgEndpoint: "",
  csWebLibFeatureFlags: {
    enableDynamicScripts: false
  }
};

/**
 * Config slice
 * - Treated as immutable runtime configuration
 */
export const configurationSlice = createSlice({
  name: "configuration",
  initialState,
  reducers: {
    // intentionally empty
  },
  selectors: {
    selectConfiguration: state => state,
    selectFeatureFlags: state => state.csWebLibFeatureFlags,
    selectEnableDynamicScripts: state =>
      state.csWebLibFeatureFlags?.enableDynamicScripts ?? false,
    selectDefaultMjpgEndpoint: state => state.defaultMjpgEndpoint
  }
});

export default configurationSlice.reducer;

export const {
  selectConfiguration,
  selectFeatureFlags,
  selectEnableDynamicScripts,
  selectDefaultMjpgEndpoint,
} = configurationSlice.selectors;
