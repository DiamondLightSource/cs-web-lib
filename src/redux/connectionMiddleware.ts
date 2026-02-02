import log from "loglevel";
import { Connection, ConnectionState } from "../connection/plugin";
import { queryDeviceAction } from "./actions";
import { DType } from "../types/dtypes";
import { Middleware, MiddlewareAPI } from "@reduxjs/toolkit";
import {
  connectionChanged,
  deviceQueried,
  subscribe,
  unsubscribe,
  valueChanged,
  writePv
} from "./csState";

function connectionChangedDispatch(
  store: MiddlewareAPI,
  pvName: string,
  value: ConnectionState
): void {
  store.dispatch(connectionChanged({ pvName, value }));
}

function valueChangedDispatch(
  store: MiddlewareAPI,
  pvName: string,
  value: DType
): void {
  store.dispatch(valueChanged({ pvName, value }));
}

function deviceQueriedDispatch(
  store: MiddlewareAPI,
  device: string,
  value: DType
): void {
  store.dispatch(deviceQueried({ device, value }));
}

export const connectionMiddleware =
  (connection: Connection): Middleware =>
  store =>
  next =>
  action => {
    if (!connection.isConnected()) {
      connection.connect(
        // Partial function application.
        (pvName: string, value: ConnectionState): void =>
          connectionChangedDispatch(store, pvName, value),
        (pvName: string, value: DType): void =>
          valueChangedDispatch(store, pvName, value),
        (device: string, value: DType): void =>
          deviceQueriedDispatch(store, device, value)
      );
    }

    if (subscribe.match(action)) {
      const { pvName, type } = action.payload;
      // Are we already subscribed?
      let effectivePvName = pvName;
      try {
        effectivePvName = connection.subscribe(pvName, type);
      } catch (error) {
        log.error(`Failed to subscribe to pv ${pvName}`);
        log.error(error);
      }
      // Even if there is a problem subscribing, the action is passed
      // on so that there is a record of this subscription. This
      // allows the unsubscription mechanism still to work.
      action = {
        ...action,
        payload: {
          ...action.payload,
          effectivePvName: effectivePvName,
          pvName: pvName
        }
      };
    } else if (writePv.match(action)) {
      const { pvName, value } = action.payload;
      const effectivePvName =
        store.getState().effectivePvNameMap[pvName] || pvName;
      try {
        connection.putPv(effectivePvName, value as DType);
      } catch (error) {
        log.error(`Failed to put to pv ${pvName}`);
        log.error(error);
      }
    } else if (unsubscribe.match(action)) {
      const { componentId, pvName } = action.payload;
      const subs = store.getState().subscriptions;
      // Is this the last subscriber?
      // The reference will be removed in csReducer.
      const effectivePvName =
        store.getState().effectivePvNameMap[pvName] || pvName;

      if (
        subs[effectivePvName].length === 1 &&
        subs[effectivePvName][0] === componentId
      ) {
        try {
          connection.unsubscribe(pvName);
        } catch (error) {
          log.error(`Failed to unsubscribe from pv ${pvName}`);
          log.error(error);
        }
      }
    } else if (queryDeviceAction.match(action)) {
      const { device } = action.payload;
      try {
        // Devices should be queried once and then stored
        if (!store.getState().deviceCache[device]) {
          connection.getDevice(device);
        }
      } catch (error) {
        log.error(`Failed to query device ${device}`);
        log.error(error);
      }
    }

    return next(action);
  };
