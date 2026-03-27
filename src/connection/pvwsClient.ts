import log from "loglevel";
import { SubscriptionType } from "./plugin";
import { Dispatch } from "@reduxjs/toolkit";
import {
  connectionChanged,
  connectionClosed,
  valueChanged
} from "../redux/csState";
import { notificationDispatcher } from "../redux/notificationUtils";
import { pvwsToDType } from "./pvwsToDType";

export const CLOSE_SOCKET_FOR_SERVICE_SWITCH = 3001;
export const RECONNECT_MILLISECONDS = 500;

export class PvwsClient {
  private socket: WebSocket;
  private url: string;
  private subscriptions: { [pvName: string]: boolean };
  private dispatch: Dispatch;
  private keepAliveInterval: ReturnType<typeof setTimeout> | undefined;

  public constructor(url: string, dispatch: Dispatch) {
    this.url = url;
    this.socket = this.newConnection();
    this.dispatch = dispatch;
    this.subscriptions = {};
    this.newConnection();
  }

  private newConnection(): WebSocket {
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
      this.socket?.addEventListener("open", _ev => {
        this.socket?.send(message);
      });
    }
  }

  public close(code?: number, reason?: string) {
    this.socket?.close(code, reason);
  }

  public getUrl(): string {
    return this.url;
  }

  handleError = (event: Event) => {
    console.log("handleError");
    console.log(event);

    log.error("Error from " + this.getUrl());
    this.close();
  };

  handleConnection = () => {
    log.debug("Connected to " + this.url);
    for (const pvName of Object.keys(this.subscriptions)) {
      // reinstate the existing subscriptions
      this.subscribe(pvName);
    }

    // start sending periodic echo messages
    this.startKeepAlive();
  };

  handleClose = (event: CloseEvent) => {
    let message = "Web socket closed (" + event.code;
    if (event.reason) {
      message += ", " + event.reason;
    }
    message += ")";
    log.debug(message);

    this.stopKeepAlive();

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
        this.socket = this.newConnection();
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

  private startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(
          JSON.stringify({ type: "echo", timestamp: Date.now() })
        );
      }
    }, 10_000);
  }

  private stopKeepAlive() {
    clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = undefined;
  }

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
