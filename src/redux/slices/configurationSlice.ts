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
  featureFlags: {
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
    selectFeatureFlags: state => state.featureFlags,
    selectEnableDynamicScripts: state =>
      state.featureFlags?.enableDynamicScripts ?? false
  }
});

export default configurationSlice.reducer;

export const {
  selectConfiguration,
  selectFeatureFlags,
  selectEnableDynamicScripts
} = configurationSlice.selectors;
