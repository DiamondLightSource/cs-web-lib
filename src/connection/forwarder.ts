import { Dispatch } from "@reduxjs/toolkit";
import { DType } from "../types/dtypes";
import { Connection, SubscriptionType } from "./plugin";

export class ConnectionForwarder implements Connection {
  private prefixConnections: [string, Connection | undefined][];

  public constructor(prefixConnections: [string, Connection | undefined][]) {
    this.prefixConnections = prefixConnections;
  }
  private getConnection(pvName: string): Connection {
    for (const [prefix, connection] of this.prefixConnections) {
      if (pvName.startsWith(prefix)) {
        if (connection !== undefined) {
          return connection;
        } else {
          throw new Error(`Connection for ${prefix} not initiated`);
        }
      }
    }
    throw new Error(`No connections for ${pvName}`);
  }

  public subscribe(pvName: string, type: SubscriptionType): string {
    const connection = this.getConnection(pvName);
    return connection.subscribe(pvName, type);
  }

  public unsubscribe(pvName: string): void {
    const connection = this.getConnection(pvName);
    return connection.unsubscribe(pvName);
  }

  public putPv(pvName: string, value: DType): void {
    const connection = this.getConnection(pvName);
    return connection.putPv(pvName, value);
  }

  public getDevice(device: string): void {
    const connection = this.getConnection(device);
    return connection.getDevice(device);
  }

  public setDispatch(dispatch: Dispatch) {
    for (const [, connection] of this.prefixConnections) {
      connection?.setDispatch(dispatch);
    }
  }
}
