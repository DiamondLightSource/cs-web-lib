import log from "loglevel";
import { Connection } from "../connection/plugin";
import { DType } from "../types/dtypes";
import { Middleware } from "@reduxjs/toolkit";
import {
  queryDevice,
  selectDevice,
  selectEffectivePvName,
  selectSubscriptions,
  subscribe,
  unsubscribe,
  writePv
} from "./csState";
import { notificationDispatcher } from "./notificationUtils";

export const connectionMiddleware =
  (connection: Connection): Middleware =>
  store =>
  next =>
  action => {
    const { showError } = notificationDispatcher(store.dispatch);
    connection.setDispatch(store.dispatch);

    if (subscribe.match(action)) {
      const { pvName, type } = action.payload;
      // Are we already subscribed?
      let effectivePvName = pvName;
      try {
        effectivePvName = connection.subscribe(pvName, type);
      } catch (error) {
        showError(`Failed to subscribe to pv ${pvName}`);
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
        selectEffectivePvName(store.getState(), pvName) || pvName;
      try {
        connection.putPv(effectivePvName, value as DType);
      } catch (error) {
        showError(`Failed to put to pv ${pvName}`);
        log.error(`Failed to put to pv ${pvName}`);
        log.error(error);
      }
    } else if (unsubscribe.match(action)) {
      const { componentId, pvName } = action.payload;
      const subs = selectSubscriptions(store.getState());
      // Is this the last subscriber?
      // The reference will be removed in csReducer.
      const effectivePvName =
        selectEffectivePvName(store.getState(), pvName) || pvName;

      if (
        subs[effectivePvName] &&
        subs[effectivePvName].length === 1 &&
        subs[effectivePvName][0] === componentId
      ) {
        try {
          connection.unsubscribe(pvName);
        } catch (error) {
          showError(`Failed to unsubscribe from pv ${pvName}`);
          log.error(`Failed to unsubscribe from pv ${pvName}`);
          log.error(error);
        }
      }
    } else if (queryDevice.match(action)) {
      const { device } = action.payload;
      try {
        // Devices should be queried once and then stored
        if (!selectDevice(store.getState(), device)) {
          connection.getDevice(device);
        }
      } catch (error) {
        showError(`Failed to query device ${device}`);
        log.error(`Failed to query device ${device}`);
        log.error(error);
      }
    }

    return next(action);
  };
