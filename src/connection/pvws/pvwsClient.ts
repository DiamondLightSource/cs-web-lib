import log from "loglevel";
import { SubscriptionType } from "../plugin";
import { Dispatch } from "@reduxjs/toolkit";
import {
  connectionChanged,
  connectionClosed,
  valueChanged
} from "../../redux/csState";
import { notificationDispatcher } from "../../redux/notificationUtils";
import { pvwsToDType } from "./pvwsToDType";

export const CLOSE_SOCKET_FOR_SERVICE_SWITCH = 3001;
export const RECONNECT_MILLISECONDS = 500;
export const HEARTBEAT_INTERVAL_SECONDS = 29.929;
const flipFlopHeartBeatPvName = `sim://flipflop(${HEARTBEAT_INTERVAL_SECONDS})`;

export class PvwsClient {
  private socket: WebSocket;
  private url: string;
  private subscriptions: { [pvName: string]: boolean };
  private dispatch: Dispatch;
  private isConnected = false;

  public constructor(url: string, dispatch: Dispatch) {
    this.url = url;
    this.socket = this.newSocket();
    this.dispatch = dispatch;
    this.subscriptions = {};
  }

  private newSocket(): WebSocket {
    const socket = new WebSocket(this.url);
    socket.onopen = this.handleConnection;
    socket.onmessage = this.handleMessage;
    socket.onclose = this.handleClose;
    socket.onerror = this.handleError;
    return socket;
  }

  public connectionState(): number {
    return this.socket?.readyState ?? WebSocket.CLOSED;
  }

  public sendMessage(message: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // Socket is set up, we can send message
      this.socket?.send(message);
    } else if (this.socket?.readyState !== WebSocket.OPEN) {
      // Socket is not set up, wait until open to send message
      const sendOnOpen = () => {
        this.socket?.send(message);
        this.socket?.removeEventListener("open", sendOnOpen);
      };
      this.socket?.addEventListener("open", sendOnOpen, { once: true });
    }
  }

  public close(code?: number, reason?: string) {
    this.socket?.close(code, reason);
  }

  public getUrl(): string {
    return this.url;
  }

  handleError = (event: Event) => {
    log.error("Error from " + this.getUrl());
    this.close();
  };

  handleConnection = () => {
    if (this.isConnected) {
      log.debug("handleConnection called but already connected");
      return;
    }

    this.isConnected = true;
    log.debug("Connected to " + this.url);
    for (const pvName of Object.keys(this.subscriptions)) {
      // reinstate the existing subscriptions
      this.subscribe(pvName);
    }

    // This forces a periodic message from pvws to keep the connection open.
    this.sendMessage(
      JSON.stringify({ type: "subscribe", pvs: [flipFlopHeartBeatPvName] })
    );
  };

  handleClose = (event: CloseEvent) => {
    this.isConnected = false;
    let message = "Web socket closed (" + event.code;
    if (event.reason) {
      message += ", " + event.reason;
    }
    message += ")";
    log.debug(message);

    for (const pvName of Object.keys(this.subscriptions)) {
      this.subscriptions[pvName] = false;
      if (this.dispatch) {
        this.dispatch(
          connectionChanged({
            pvName,
            value: {
              isConnected: false,
              isReadonly: true
            }
          })
        );
      }
    }

    if (event.code !== CLOSE_SOCKET_FOR_SERVICE_SWITCH) {
      log.debug(
        "Scheduling re-connect to " +
          this.url +
          " in " +
          RECONNECT_MILLISECONDS +
          "ms"
      );

      setTimeout(() => {
        this.socket = this.newSocket();
      }, RECONNECT_MILLISECONDS);
    }
  };

  handleMessage = (event: MessageEvent) => {
    const jm = JSON.parse(event.data);
    if (jm.type === "update") {
      if (this.dispatch) {
        this.dispatch(
          connectionChanged({
            pvName: jm.pv,
            value: {
              isConnected: true,
              isReadonly: jm.readonly
            }
          })
        );

        this.dispatch(valueChanged({ pvName: jm.pv, value: pvwsToDType(jm) }));
      }
    } else if (jm.type === "error") {
      if (this.dispatch) {
        const { showError } = notificationDispatcher(this.dispatch);
        showError(`${jm?.message}`);
      }

      log.error(`PVWS error message: ${jm?.message}`);
    }
  };

  public subscribe(pvName: string, type?: SubscriptionType): string {
    // TODO: How to handle multiple subscriptions of different types to the same channel?
    if (!this.subscriptions[pvName]) {
      this.sendMessage(JSON.stringify({ type: "subscribe", pvs: [pvName] }));
      this.subscriptions[pvName] = true;
    }
    return pvName;
  }

  public unsubscribe(pvName: string): void {
    if (this.subscriptions[pvName]) {
      this.sendMessage(JSON.stringify({ type: "clear", pvs: [pvName] }));
      delete this.subscriptions[pvName];
    }

    if (this.dispatch) {
      this.dispatch(connectionClosed({ pvName }));
    }
  }
}
