import { Connection } from ".";
import { ConnectionForwarder } from "./forwarder";
import { PvwsPlugin } from "./pvws";
import { SimulatorPlugin } from "./sim";
import { CsWebLibConfig } from "../redux/CsWebLibConfig";
import { Dispatch } from "@reduxjs/toolkit";

// This is the common connection forwarder singleton for all service types
let connection: ConnectionForwarder | undefined;

const buildConnection = (
  dispatch: Dispatch,
  config?: CsWebLibConfig
): ConnectionForwarder => {
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
    const pvws = new PvwsPlugin(PVWS_SOCKET, PVWS_SSL, dispatch);
    plugins.unshift(["pva://", pvws]);
    plugins.unshift(["ca://", pvws]);
    plugins.unshift(["loc://", pvws]);
    plugins.unshift(["sim://", pvws]);
    plugins.unshift(["ssim://", pvws]);
    plugins.unshift(["dev://", pvws]);
    plugins.unshift(["eq://", pvws]);
  }

  return new ConnectionForwarder(plugins);
};

export const buildServiceConnection = (
  dispatch: Dispatch,
  config?: CsWebLibConfig
): void => {
  if (!connection) {
    connection = buildConnection(dispatch, config);
  }
};

export const getServiceConnection = (): ConnectionForwarder => {
  if (!connection) {
    const message =
      "A service connection instance does not exist, cannot contact the server";
    throw new Error(message);
  }

  return connection;
};
