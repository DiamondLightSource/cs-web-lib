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
  private currentFetchAbort?: AbortController;

  private onErrorMessageCallback: (message: string | undefined) => void;
  private onConnectionClosedCallback: (message: string | undefined) => void;
  private onValueChangedCallback: (pvName: string, value: DType) => void;
  private onConnectionChangedCallback: (
    pvName: string,
    isConnected: boolean,
    isReadonly: boolean
  ) => void;
  private fetchTimeout: number;

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
    onErrorMessageCallback: (message: string | undefined) => void,
    fetchTimeout = 2000
  ) {
    if (ssl) {
      this.wsProtocol = "wss";
    }
    this.fallbackUrl = `${this.wsProtocol}://${socketHost}/pvws/pv`;
    this.onErrorMessageCallback = onErrorMessageCallback;
    this.onValueChangedCallback = onValueChangedCallback;
    this.onConnectionChangedCallback = onConnectionChangedCallback;
    this.onConnectionClosedCallback = onConnectionClosedCallback;
    this.fetchTimeout = fetchTimeout;

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

  public async updatePvwsHost(hostname: string | undefined) {
    const desiredUrl = hostname
      ? `${this.wsProtocol}://${hostname}/pvws/pv`
      : this.fallbackUrl;

    // No-op if already connected
    if (desiredUrl === this.client?.getUrl()) return;

    this.currentFetchAbort?.abort("CONFLICT");

    const controller = new AbortController();
    this.currentFetchAbort = controller;

    let socketUrl = this.fallbackUrl;
    let fetchTimedOut = false;
    if (hostname) {
      const id = setTimeout(
        () => controller.abort("TIMEOUT"),
        this.fetchTimeout
      );
      try {
        const response = await fetch(`https://${hostname}/pvws/info`, {
          signal: controller.signal
        });

        if (response.ok) {
          socketUrl = desiredUrl;
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          log.debug(
            "PvwsPlugin.updatePvwsHostname: Could not connect to preferred PVWS instance; using fallback"
          );
        } else if (err instanceof DOMException && err.name === "AbortError") {
          const reason = (err as any).reason;
          if (reason === "TIMEOUT") {
            log.debug(
              `PvwsPlugin.updatePvwsHostname: Timed out when getting from PVWS - https://${hostname}/pvws/info`
            );
            fetchTimedOut = true;
          } else {
            log.debug(
              `PvwsPlugin.updatePvwsHostname: Aborted GET from PVWS - https://${hostname}/pvws/info`
            );
          }
        }

        clearTimeout(id);
      }
    }

    // If fetch was aborted due to newer request → do nothing
    if (controller.signal.aborted && !fetchTimedOut) return;

    // Switch the socket
    if (socketUrl !== this.client?.getUrl()) {
      this.client.close(
        CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
      this.client = this.newPvwsClient(socketUrl);
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
