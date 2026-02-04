import log from "loglevel";
import { MacroMap } from "../types/macros";
import { DType, mergeDType } from "../types/dtypes";
import { WidgetDescription } from "../ui/widgets/createComponent";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SubscriptionType } from "../connection";

const initialState: CsState = {
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
  console.log(mergedValue);
  valueCache[pvName] = { ...valueCache[pvName], value: mergedValue };
}

const csSlice = createSlice({
  name: "cs",
  initialState,
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
