import { Connection } from ".";
import { ConnectionForwarder } from "./forwarder";
import { PvwsPlugin } from "./pvws/pvwsPlugin";
import { SimulatorPlugin } from "./sim";
import { CsWebLibConfig } from "../redux/csWebLibConfig";
import { Dispatch } from "@reduxjs/toolkit";
import {
  connectionChanged,
  connectionClosed,
  valueChanged
} from "../redux/csState";
import { notificationDispatcher } from "../redux/notificationUtils";
import { DType } from "../types/dtypes";

// This is the common connection forwarder singleton for all service types
let connection: ConnectionForwarder | undefined;
let pvwsConnection: PvwsPlugin | undefined;
let buildServiceConnectionCalled = false;

const onErrorMessageCallback =
  (dispatch: Dispatch) => (message: string | undefined) => {
    const { showError } = notificationDispatcher(dispatch);
    showError(`${message}`);
  };

const onConnectionClosedCallback =
  (dispatch: Dispatch) => (pvName: string | undefined) => {
    if (!pvName) {
      return;
    }
    dispatch(connectionClosed({ pvName }));
  };

const onValueChangedCallback =
  (dispatch: Dispatch) => (pvName: string, value: DType) => {
    if (!pvName) {
      return;
    }

    dispatch(valueChanged({ pvName, value }));
  };

const onConnectionChangedCallback =
  (dispatch: Dispatch) =>
  (pvName: string, isConnected: boolean, isReadonly: boolean) => {
    if (!pvName) {
      return;
    }

    dispatch(
      connectionChanged({
        pvName,
        value: {
          isConnected,
          isReadonly
        }
      })
    );
  };

export const buildServiceConnection = (
  dispatch: Dispatch,
  config?: CsWebLibConfig
): void => {
  if (connection || buildServiceConnectionCalled) {
    // Should only be called once
    return;
  }

  buildServiceConnectionCalled = true;

  const PVWS_SOCKET =
    config?.PVWS_SOCKET ??
    process.env.VITE_PVWS_SOCKET ??
    import.meta.env.VITE_PVWS_SOCKET;
  const PVWS_SSL = !!(
    config?.PVWS_SSL ??
    (process.env.VITE_PVWS_SSL ?? import.meta.env.VITE_PVWS_SSL) === "true"
  );

  const simulator = new SimulatorPlugin(dispatch);
  const plugins: [string, Connection][] = [["sim://", simulator]];

  if (PVWS_SOCKET !== undefined) {
    pvwsConnection =
      pvwsConnection ??
      new PvwsPlugin(
        PVWS_SOCKET,
        PVWS_SSL,
        onConnectionChangedCallback(dispatch),
        onValueChangedCallback(dispatch),
        onConnectionClosedCallback(dispatch),
        onErrorMessageCallback(dispatch)
      );
    plugins.unshift(["pva://", pvwsConnection]);
    plugins.unshift(["ca://", pvwsConnection]);
    plugins.unshift(["loc://", pvwsConnection]);
    plugins.unshift(["sim://", pvwsConnection]);
    plugins.unshift(["ssim://", pvwsConnection]);
    plugins.unshift(["dev://", pvwsConnection]);
    plugins.unshift(["eq://", pvwsConnection]);
  }

  connection = new ConnectionForwarder(plugins);
};

export const getServiceConnection = (): ConnectionForwarder => {
  if (!connection) {
    const message =
      "A service connection instance does not exist, cannot contact the server";
    throw new Error(message);
  }

  return connection;
};

export const updatePvwsHostname = (pvwsHost: string | undefined) => {
  pvwsConnection?.updatePvwsHost(pvwsHost);
};
