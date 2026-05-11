// configurationSlice.test.ts
import { describe, it, expect } from "vitest";
import reducer, {
  selectConfiguration,
  selectFeatureFlags,
  selectEnableDynamicScripts
} from "./configurationSlice";
import type { CsWebLibConfig } from "../csWebLibConfig";

describe("configurationSlice", () => {
  const defaultState: CsWebLibConfig = {
    storeMode: "DEV",
    PVWS_SOCKET: "",
    PVWS_SSL: true,
    THROTTLE_PERIOD: 100,
    defaultMjpgEndpoint: "",
    csWebLibFeatureFlags: {
      enableDynamicScripts: false
    }
  };

  describe("reducer", () => {
    it("should return the initial state when called with undefined", () => {
      const state = reducer(undefined, { type: "@@INIT" });
      expect(state).toEqual(defaultState);
    });

    it("should ignore unknown actions and return the same state", () => {
      const state = reducer(defaultState, {
        type: "unknown/action"
      });
      expect(state).toBe(defaultState);
    });
  });

  describe("selectors", () => {
    it("selectConfiguration should return the entire configuration state", () => {
      const result = selectConfiguration({ configuration: defaultState });
      expect(result).toEqual(defaultState);
    });

    it("selectFeatureFlags should return featureFlags", () => {
      const result = selectFeatureFlags({ configuration: defaultState });
      expect(result).toEqual({
        enableDynamicScripts: false
      });
    });

    it("selectEnableDynamicScripts should return false by default", () => {
      const result = selectEnableDynamicScripts({
        configuration: defaultState
      });
      expect(result).toBe(false);
    });

    it("selectEnableDynamicScripts should return true when flag is enabled", () => {
      const state: CsWebLibConfig = {
        ...defaultState,
        csWebLibFeatureFlags: {
          enableDynamicScripts: true
        }
      };

      const result = selectEnableDynamicScripts({ configuration: state });
      expect(result).toBe(true);
    });

    it("selectEnableDynamicScripts should return false if featureFlags is empty", () => {
      const state = {
        ...defaultState,
        csWebLibFeatureFlags: {}
      } as CsWebLibConfig;

      const result = selectEnableDynamicScripts({ configuration: state });
      expect(result).toBe(false);
    });
  });
});
