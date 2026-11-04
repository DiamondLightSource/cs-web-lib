import log from "loglevel";
import { SubscriptionType } from "../plugin";
import { pvwsToDType } from "./pvwsToDType";
import { DType } from "../../types/dtypes";

export const CLOSE_SOCKET_FOR_SERVICE_SWITCH = 3001;
export const RECONNECT_MILLISECONDS = 500;
export const HEARTBEAT_INTERVAL_SECONDS = 29.929;
const flipFlopHeartBeatPvName = `sim://flipflop(${HEARTBEAT_INTERVAL_SECONDS})`;

export class PvwsClient {
  private socket: WebSocket;
  private url: string;
  private subscriptions: { [pvName: string]: boolean };
  private isConnected = false;

  private onErrorMessageCallback: (message: string | undefined) => void;
  private onConnectionClosedCallback: (message: string | undefined) => void;
  private onValueChangedCallback: (pvName: string, value: DType) => void;
  private onConnectionChangedCallback: (
    pvName: string,
    isConnected: boolean,
    isReadonly: boolean
  ) => void;
  private pvConnState: {
    [pvName: string]: { connected: boolean; readonly?: boolean };
  } = {};
  private pendingSubscribes: string[] = [];
  private flushScheduled = false;
  private cachePreservePeriod: number;
  private closeTimers: { [pvName: string]: ReturnType<typeof setTimeout> } = {};
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private shuttingDown = false;

  public constructor(
    url: string,
    onConnectionChangedCallback: (
      pvName: string,
      isConnected: boolean,
      isReadonly: boolean
    ) => void,
    onValueChangedCallback: (pvName: string, value: DType) => void,
    onConnectionClosedCallback: (message: string | undefined) => void,
    onErrorMessageCallback: (message: string | undefined) => void,
    cachePreservePeriod = 0
  ) {
    this.url = url;
    this.socket = this.newSocket();
    this.subscriptions = {};
    this.cachePreservePeriod = cachePreservePeriod;
    this.onErrorMessageCallback = onErrorMessageCallback;
    this.onValueChangedCallback = onValueChangedCallback;
    this.onConnectionChangedCallback = onConnectionChangedCallback;
    this.onConnectionClosedCallback = onConnectionClosedCallback;
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
    } else {
      // Socket is not set up, wait until open to send message
      const sendOnOpen = () => {
        this.socket?.send(message);
        this.socket?.removeEventListener("open", sendOnOpen);
      };
      this.socket?.addEventListener("open", sendOnOpen, { once: true });
    }
  }

  public close(code?: number, reason?: string) {
    if (code === CLOSE_SOCKET_FOR_SERVICE_SWITCH) {
      // Permanent shutdown: cancel any pending reconnect
      this.shuttingDown = true;
      clearTimeout(this.reconnectTimer);
    }
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
      if (this.onConnectionChangedCallback) {
        this.onConnectionChangedCallback(pvName, false, true);
      }
    }
    this.pvConnState = {};

    if (event.code !== CLOSE_SOCKET_FOR_SERVICE_SWITCH && !this.shuttingDown) {
      log.debug(
        "Scheduling re-connect to " +
          this.url +
          " in " +
          RECONNECT_MILLISECONDS +
          "ms"
      );
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.socket = this.newSocket();
      }, RECONNECT_MILLISECONDS);
    }
  };

  handleMessage = (event: MessageEvent) => {
    const jm = JSON.parse(event.data);
    if (jm.type === "update") {
      const prev = this.pvConnState[jm.pv];
      const readonlyChanged =
        jm.readonly !== undefined && jm.readonly !== prev?.readonly;

      // Only notify when the connection state actually changed
      if (!prev || !prev.connected || readonlyChanged) {
        this.pvConnState[jm.pv] = {
          connected: true,
          readonly: jm.readonly ?? prev?.readonly
        };
        if (this.onConnectionChangedCallback) {
          this.onConnectionChangedCallback(jm.pv, true, jm.readonly);
        }
      }
      if (this.onValueChangedCallback) {
        this.onValueChangedCallback(jm.pv, pvwsToDType(jm));
      }
    } else if (jm.type === "error") {
      if (this.onErrorMessageCallback) {
        this.onErrorMessageCallback(jm?.message);
      }

      log.error(`PVWS error message: ${jm?.message}`);
    }
  };

  public subscribe(pvName: string, type?: SubscriptionType): string {
    // Cancel pending unsubscribes if we are resubscribing to that pv
    if (this.closeTimers[pvName]) {
      clearTimeout(this.closeTimers[pvName]);
      delete this.closeTimers[pvName];
    }
    // TODO: How to handle multiple subscriptions of different types to the same channel?
    if (!this.subscriptions[pvName]) {
      this.pendingSubscribes.push(pvName);
      this.scheduleSubscribeFlush();
      this.subscriptions[pvName] = true;
    }
    return pvName;
  }

  // Batches subscriptions together
  private scheduleSubscribeFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      const pvs = this.pendingSubscribes;
      this.pendingSubscribes = [];
      if (pvs.length > 0) {
        this.sendMessage(JSON.stringify({ type: "subscribe", pvs }));
      }
    });
  }

  public unsubscribe(pvName: string): void {
    if (!(pvName in this.subscriptions)) return;

    const pendingIdx = this.pendingSubscribes.indexOf(pvName);
    if (pendingIdx >= 0) {
      this.pendingSubscribes.splice(pendingIdx, 1);
    } else if (this.subscriptions[pvName]) {
      this.sendMessage(JSON.stringify({ type: "clear", pvs: [pvName] }));
    }

    delete this.subscriptions[pvName];
    delete this.pvConnState[pvName];

    if (this.onConnectionClosedCallback) {
      clearTimeout(this.closeTimers[pvName]);
      this.closeTimers[pvName] = setTimeout(() => {
        delete this.closeTimers[pvName];
        this.onConnectionClosedCallback(pvName);
      }, this.cachePreservePeriod);
    }
  }
}
