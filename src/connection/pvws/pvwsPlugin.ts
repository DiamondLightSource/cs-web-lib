/* Module that handles a GraphQL connection to the PVWS server.
   See https://github.com/ornl-epics/pvws
 */
import { Connection, SubscriptionType } from "../plugin";

import { DType } from "../../types/dtypes";
import log from "loglevel";
import { CLOSE_SOCKET_FOR_SERVICE_SWITCH, PvwsClient } from "./pvwsClient";

export class PvwsPlugin implements Connection {
  private wsProtocol = "ws";
  private fallbackUrl: string;
  private client: PvwsClient;

  private onErrorMessageCallback: (message: string | undefined) => void;
  private onConnectionClosedCallback: (message: string | undefined) => void;
  private onValueChangedCallback: (pvName: string, value: DType) => void;
  private onConnectionChangedCallback: (
    pvName: string,
    isConnected: boolean,
    isReadonly: boolean
  ) => void;

  public constructor(
    socketHost: string,
    ssl: boolean,
    onConnectionChangedCallback: (
      pvName: string,
      isConnected: boolean,
      isReadonly: boolean
    ) => void,
    onValueChangedCallback: (pvName: string, value: DType) => void,
    onConnectionClosedCallback: (message: string | undefined) => void,
    onErrorMessageCallback: (message: string | undefined) => void
  ) {
    if (ssl) {
      this.wsProtocol = "wss";
    }
    this.fallbackUrl = `${this.wsProtocol}://${socketHost}/pvws/pv`;
    this.onErrorMessageCallback = onErrorMessageCallback;
    this.onValueChangedCallback = onValueChangedCallback;
    this.onConnectionChangedCallback = onConnectionChangedCallback;
    this.onConnectionClosedCallback = onConnectionClosedCallback;

    this.client = this.newPvwsClient(this.fallbackUrl);
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
          log.debug(
            "PvwsPlugin.updatePvwsHostname: Could not connect to the preferred PVWS instance falling back to the default"
          );
        })
        .finally(() => {
          if (socketUrl !== this.client?.getUrl()) {
            this.client.close(
              CLOSE_SOCKET_FOR_SERVICE_SWITCH,
              "Closing socket for PVWS service endpoint change"
            );
            this.client = this.newPvwsClient(socketUrl);
          }
        });
    } else {
      this.client.close(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
      // New hostname is undefined, connect to the fallback PVWS service.
      this.client = this.newPvwsClient(this.fallbackUrl);
    }
  }

  private newPvwsClient(url: string) {
    return new PvwsClient(
      url,
      this.onConnectionChangedCallback,
      this.onValueChangedCallback,
      this.onConnectionClosedCallback,
      this.onErrorMessageCallback
    );
  }

  private sendMessage(message: string) {
    if (!this.client) {
      log.error("Attempted to send message when not connected to a websocket.");
    }

    this.client?.sendMessage(message);
  }
}
