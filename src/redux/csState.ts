import log from "loglevel";
import { MacroMap } from "../types/macros";
import { mergeDType, DType } from "../types/dtypes";
import { WidgetDescription } from "../ui/widgets/createComponent";
import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SubscriptionType } from "../connection";

export const initialCsState: CsState = {
  valueCache: {},
  globalMacros: { SUFFIX: "1" },
  effectivePvNameMap: {},
  subscriptions: {},
  deviceCache: {},
  fileCache: {}
};

export interface PvState {
  value?: DType;
  connected: boolean;
  readonly: boolean;
}

export type PvDatum = PvState & {
  effectivePvName: string;
};

export type PvDataCollection = {
  pvData: PvDatum[];
};

export interface FullPvState extends PvState {
  initializingPvName: string;
}

export interface ValueCache {
  [pvName: string]: FullPvState;
}

export interface Subscriptions {
  [pvName: string]: string[];
}

export interface DeviceCache {
  [deviceName: string]: DType;
}

export interface FileCache {
  [fileName: string]: WidgetDescription;
}

export interface PvArrayResults {
  [pvName: string]: [PvState, string];
}

/* The shape of the store for the entire application. */
export interface CsState {
  valueCache: ValueCache;
  effectivePvNameMap: { [pvName: string]: string };
  globalMacros: MacroMap;
  subscriptions: Subscriptions;
  deviceCache: DeviceCache;
  fileCache: FileCache;
}

type ValueChangedActionType = PayloadAction<{ pvName: string; value: DType }>;

/* Given a new object that is a shallow copy of the original
   valueCache, update with contents of a ValueChanged action. */
function updateValueCache(
  valueCache: ValueCache,
  action: ValueChangedActionType
): void {
  const { pvName, value } = action.payload;
  const mergedValue = mergeDType(valueCache[pvName]?.value, value);
  valueCache[pvName] = { ...valueCache[pvName], value: mergedValue };
}

const csSlice = createSlice({
  name: "cs",
  initialState: initialCsState,
  reducers: {
    valueChanged(state, action: ValueChangedActionType) {
      log.debug(action);
      updateValueCache(state.valueCache, action);
    },

    valuesChanged(state, action: PayloadAction<Array<ValueChangedActionType>>) {
      log.debug(action);
      for (const valueAction of action.payload) {
        updateValueCache(state.valueCache, valueAction);
      }
    },

    connectionChanged(
      state,
      action: PayloadAction<{
        pvName: string;
        value: { isConnected: boolean; isReadonly: boolean };
      }>
    ) {
      log.debug(action);
      const { pvName, value } = action.payload;
      const existing = state.valueCache[pvName] ?? {
        connected: false,
        readonly: false,
        initializingPvName: pvName
      };
      state.valueCache[pvName] = {
        ...existing,
        connected: value.isConnected,
        readonly: value.isReadonly
      };
    },

    subscribe(
      state,
      action: PayloadAction<{
        componentId: string;
        pvName: string;
        effectivePvName?: string;
        type: SubscriptionType;
      }>
    ) {
      // the connection middleware intercepts this action and injects the effectivePvName before forwarding it
      log.debug(action);
      const { componentId, pvName } = action.payload;
      const effectivePvName = action.payload?.effectivePvName || pvName;

      const list = state.subscriptions[effectivePvName] ?? [];
      if (!list.includes(componentId)) {
        list.push(componentId);
        state.subscriptions[effectivePvName] = list;
      }

      if (pvName !== effectivePvName) {
        state.effectivePvNameMap[pvName] = effectivePvName;
      }
    },

    unsubscribe(
      state,
      action: PayloadAction<{ componentId: string; pvName: string }>
    ) {
      log.debug(action);
      const { componentId, pvName } = action.payload;
      const effectivePvName = state.effectivePvNameMap[pvName] ?? pvName;

      const current = state.subscriptions[effectivePvName] ?? [];
      const next = current.filter(id => id !== componentId);
      if (next.length === 0) {
        delete state.subscriptions[effectivePvName];

        Object.keys(state.effectivePvNameMap).forEach((key: string) => {
          if (state.effectivePvNameMap[key] === effectivePvName) {
            delete state.effectivePvNameMap[key];
          }
        });
      } else {
        state.subscriptions[effectivePvName] = next;
      }
    },

    writePv(_state, _action: PayloadAction<{ pvName: string; value: DType }>) {
      // intentionally empty — handled by listener middleware
    },

    deviceQueried(
      state,
      action: PayloadAction<{ device: string; value: DType }>
    ) {
      log.debug(action);
      const { device, value } = action.payload;
      state.deviceCache[device] = value;
    },

    queryDevice(_state, _action: PayloadAction<{ device: string }>) {
      // intentionally empty — handled by listener middleware
    },

    fileChanged(
      state,
      action: PayloadAction<{ file: string; contents: WidgetDescription }>
    ) {
      log.debug(action);
      const { file, contents } = action.payload;
      state.fileCache[file] = contents;
    },

    refreshFile(state, action: PayloadAction<{ file: string }>) {
      log.debug(action);
      const { file } = action.payload;
      delete state.fileCache[file];
    }
  },
  selectors: {
    selectDeviceCache: state => state.deviceCache,
    selectFileCache: state => state.fileCache,
    selectEffectivePvNameMap: state => state.effectivePvNameMap,
    selectValueCache: state => state.valueCache,
    selectGlobalMacros: state => state.globalMacros,
    selectSubscriptions: state => state.subscriptions
  }
});

export const {
  valueChanged,
  valuesChanged,
  connectionChanged,
  subscribe,
  unsubscribe,
  writePv,
  deviceQueried,
  queryDevice,
  fileChanged,
  refreshFile
} = csSlice.actions;
export default csSlice.reducer;
export const {
  selectDeviceCache,
  selectFileCache,
  selectEffectivePvNameMap,
  selectValueCache,
  selectGlobalMacros,
  selectSubscriptions
} = csSlice.selectors;

export const selectEffectivePvName = createSelector(
  [selectEffectivePvNameMap, (_state, pvName: string) => pvName],
  (effectivePvNameMap, pvName) => effectivePvNameMap[pvName]
);

export const selectDevice = createSelector(
  [selectDeviceCache, (_state, deviceId: string) => deviceId],
  (deviceCache, deviceId) => deviceCache[deviceId]
);

export const selectFile = createSelector(
  [selectFileCache, (_state, fileId: string) => fileId],
  (fileCache, fileId) => fileCache[fileId]
);

export const selectPvStates = createSelector(
  [
    selectEffectivePvNameMap,
    selectValueCache,
    (_state, pvNames: string[]) => pvNames
  ],
  (pvNameMap, valueCache, pvNames) => {
    const results: {
      [pvName: string]: [PvState, string];
    } = {};
    for (const pvName of pvNames) {
      const effectivePvName = pvNameMap[pvName] || pvName;
      results[pvName] = [valueCache[effectivePvName], effectivePvName];
    }
    return results;
  }
);

export const fileComparator = (
  before: WidgetDescription,
  after: WidgetDescription
): boolean => {
  if (!before || !after) {
    return false;
  }
  if (Object.keys(before).length !== Object.keys(after).length) {
    return false;
  }
  if (before.children?.length !== after.children?.length) {
    return false;
  }
  // Can't compare objects directly because they are in different memory locations
  // But we can compare strings
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    return false;
  }
  return true;
};
/* Used for preventing re-rendering if the results are equivalent.
   Note that if the state for a particular PV hasn't changed, we will
   get back the same object as last time so we are safe to compare them.
   We need to be careful that we don't have a situation where we get back
   the same object with different properties and compare it as equal when
   in fact it has changed.
*/

export const pvStateComparator = (
  before: PvArrayResults,
  after: PvArrayResults
): boolean => {
  if (Object.keys(before).length !== Object.keys(after).length) {
    return false;
  }
  for (const [pvName, [beforeVal, beforeEffPvName]] of Object.entries(before)) {
    // If the PV name for a widget has changed the previous results may
    // not resemble the new results at all.
    if (!after.hasOwnProperty(pvName)) {
      return false;
    }
    const [afterVal, afterEffPvName] = after[pvName];
    // If the PV state hasn't changed in the store, we will receive the same
    // object when selecting that PV state.
    if (beforeVal !== afterVal || beforeEffPvName !== afterEffPvName) {
      return false;
    }
  }
  return true;
};

export const deviceComparator = (before: DType, after: DType): boolean => {
  if (!before || !after) {
    return false;
  }
  if (Object.keys(before).length !== Object.keys(after).length) {
    return false;
  }
  if (before.value.stringValue !== after.value.stringValue) {
    return false;
  }
  return true;
};
