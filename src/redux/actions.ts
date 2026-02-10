import { DType } from "../types/dtypes";
import { ConnectionState, SubscriptionType } from "../connection/plugin";
import { createAction } from "@reduxjs/toolkit";

export const CONNECTION_CHANGED = "connection_changed";
export const SUBSCRIBE = "subscribe";
export const UNSUBSCRIBE = "unsubscribe";
export const VALUE_CHANGED = "value_changed";
export const VALUES_CHANGED = "values_changed";
export const WRITE_PV = "write_pv";
export const DEVICE_QUERIED = "device_queried";
export const QUERY_DEVICE = "query_device";
export const FILE_CHANGED = "file_changed";
export const REFRESH_FILE = "refresh_file";

/* The never type in the constructor ensures that TypeScript
   won't allow this error to be created. This is useful in
   switch blocks to check that all cases have been handled. */
export class InvalidAction extends Error {
  public constructor(val: never) {
    super(`Invalid action: ${val}`);
  }
}

export interface ConnectionChanged {
  type: typeof CONNECTION_CHANGED;
  payload: {
    pvName: string;
    value: ConnectionState;
  };
}

export const connectionChangedAction = createAction<{
  pvName: string;
  value: ConnectionState;
}>(CONNECTION_CHANGED);

export interface Subscribe {
  type: typeof SUBSCRIBE;
  payload: {
    componentId: string;
    pvName: string;
    effectivePvName: string;
    type: SubscriptionType;
  };
}

export const subscribeAction = createAction<{
  componentId: string;
  pvName: string;
  effectivePvName?: string;
  type: SubscriptionType;
}>(SUBSCRIBE);

export interface Unsubscribe {
  type: typeof UNSUBSCRIBE;
  payload: {
    componentId: string;
    pvName: string;
  };
}

export const unsubscribeAction = createAction<{
  componentId: string;
  pvName: string;
}>(UNSUBSCRIBE);

export interface ValueChanged {
  type: typeof VALUE_CHANGED;
  payload: {
    pvName: string;
    value: DType;
  };
}

export const valueChangedAction = createAction<{
  pvName: string;
  value: DType;
}>(VALUE_CHANGED);

export interface ValuesChanged {
  type: typeof VALUES_CHANGED;
  payload: ValueChanged[];
}

export const valuesChangedAction = createAction<ValueChanged[]>(VALUES_CHANGED);

export interface WritePv {
  type: typeof WRITE_PV;
  payload: {
    pvName: string;
    value: DType;
  };
}

export const writePvAction = createAction<{
  pvName: string;
  value: DType;
}>(WRITE_PV);

export interface DeviceQueried {
  type: typeof DEVICE_QUERIED;
  payload: {
    device: string;
    value: DType;
  };
}

export const deviceQueriedAction = createAction<{
  device: string;
  value: DType;
}>(DEVICE_QUERIED);

export interface QueryDevice {
  type: typeof QUERY_DEVICE;
  payload: {
    device: string;
  };
}

export const queryDeviceAction = createAction<{
  device: string;
  value: DType;
}>(QUERY_DEVICE);

export interface FileChanged {
  type: typeof FILE_CHANGED;
  payload: {
    file: string;
    contents: any;
  };
}

export const fileChangedAction = createAction<{
  file: string;
  contents: any;
}>(FILE_CHANGED);

export interface RefreshFile {
  type: typeof REFRESH_FILE;
  payload: {
    file: string;
  };
}

export const refreshFileAction = createAction<{
  file: string;
}>(REFRESH_FILE);

export type Action =
  | ConnectionChanged
  | Subscribe
  | Unsubscribe
  | ValueChanged
  | ValuesChanged
  | WritePv
  | DeviceQueried
  | QueryDevice
  | FileChanged
  | RefreshFile;
