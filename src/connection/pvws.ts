/* Module that handles a GraphQL connection to the PVWS server.
   See https://github.com/ornl-epics/pvws
 */
import { Connection, SubscriptionType } from "./plugin";

import { DType } from "../types/dtypes";
import log from "loglevel";
import { CLOSE_SOCKET_FOR_SERVICE_SWITCH, PvwsClient } from "./pvwsClient";
import { Dispatch } from "@reduxjs/toolkit";

export class PvwsPlugin implements Connection {
  private wsProtocol = "ws";
  private dispatch: Dispatch;
  private fallbackUrl: string;
  private client: PvwsClient;

  public constructor(socket: string, ssl: boolean, dispatch: Dispatch) {
    if (ssl) {
      this.wsProtocol = "wss";
    }
    this.fallbackUrl = `${this.wsProtocol}://${socket}/pvws/pv`;
    this.dispatch = dispatch;
    this.client = this.newConnection(this.fallbackUrl);
  }

  public subscribe = (pvName: string, type?: SubscriptionType): string =>
    this.client?.subscribe(pvName, type);
  public unsubscribe = (pvName: string): void =>
    this.client?.unsubscribe(pvName);

  public getDevice(device: string): void {
    // Not implemented;
  }

  public putPv(pvName: string, value: DType): void {
    this.sendMessage(
      JSON.stringify({
        type: "write",
        pv: pvName,
        value:
          value.value.stringValue === undefined
            ? value.value.doubleValue
            : value.value.stringValue
      })
    );
  }

  public updatePvwsHost(hostname: string | undefined) {
    const url = hostname
      ? `${this.wsProtocol}://${hostname}/pvws/pv`
      : this.fallbackUrl;

    if (url === this.client?.getUrl()) {
      // Already connected to the desired websocket
      return;
    }

    if (hostname) {
      let socketUrl = this.fallbackUrl;
      // Make a GET request to the PVWS info endpoint to ensure it is accessible
      fetch(`https://${hostname}/pvws/info`)
        .then(response => {
          if (response.ok) {
            socketUrl = url;
          }
        })
        .catch(error => {
          log.debug("pvws.updatePvwsHostname");
          console.log("updatePvwsHostname, ERROR response" + error);
        })
        .finally(() => {
          if (socketUrl !== this.client?.getUrl()) {
            this.client.close(
              CLOSE_SOCKET_FOR_SERVICE_SWITCH,
              "Closing socket for PVWS service endpoint change"
            );
            this.client = this.newConnection(socketUrl);
          }
        });
    } else {
      this.client.close(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
      // New hostname is undefined, connect to the fallback PVWS service.
      this.client = this.newConnection(this.fallbackUrl);
    }
  }

  private newConnection(url: string) {
    return new PvwsClient(url, this.dispatch);
  }

  private sendMessage(message: string) {
    if (!this.client) {
      log.error("Attempted to send message when not connected to a websocket.");
    }

    this.client?.sendMessage(message);
  }
}
