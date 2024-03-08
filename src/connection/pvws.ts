/* Module that handles a GraphQL connection to the PVWS server.
   See https://github.com/ornl-epics/pvws
 */
import base64js from "base64-js";
import {
  Connection,
  ConnectionChangedCallback,
  ValueChangedCallback,
  nullConnCallback,
  nullValueCallback,
  SubscriptionType
} from "./plugin";

import {
  DType,
  DTime,
  DAlarm,
  AlarmQuality,
  DDisplay,
  DRange
} from "../types/dtypes";
import log from "loglevel";

export interface PvwsStatus {
  quality: "ALARM" | "WARNING" | "VALID" | "INVALID" | "UNDEFINED" | "CHANGING";
  message: string;
  mutable: boolean;
}

type PVWS_TYPE =
  | "INT8"
  | "UINT8"
  | "INT16"
  | "UINT16"
  | "INT32"
  | "UINT32"
  | "INT32"
  | "INT64"
  | "FLOAT32"
  | "FLOAT64";

const ARRAY_TYPES = {
  INT8: Int8Array,
  UINT8: Uint8Array,
  INT16: Int16Array,
  UINT16: Uint16Array,
  INT32: Int32Array,
  UINT32: Uint32Array,
  INT64: BigInt64Array,
  UINT64: BigUint64Array,
  FLOAT32: Float32Array,
  FLOAT64: Float64Array
};
export interface PvwsBase64Array {
  numberType: PVWS_TYPE;
  base64: string;
}

export interface PvwsTime {
  datetime: Date;
}

function pvwsToDType(data: any): DType {
  let alarm = undefined;
  let ddisplay = undefined;
  if (data.severity !== undefined) {
    if (data.severity === "MAJOR") {
      alarm = new DAlarm(AlarmQuality.ALARM, "");
    } else if (data.severity === "MINOR") {
      alarm = new DAlarm(AlarmQuality.WARNING, "");
    } else {
      alarm = new DAlarm(AlarmQuality.VALID, "");
    }
  }
  ddisplay = new DDisplay({
    description: undefined,
    role: undefined,
    controlRange: undefined,
    alarmRange: data.alarm_low
      ? new DRange(data.alarm_low, data.alarm_high)
      : undefined,
    warningRange: data.warn_low
      ? new DRange(data.warn_low, data.warn_high)
      : undefined,
    units: data.units,
    precision: data.precision,
    form: undefined,
    choices: data.labels ? data.labels : undefined
  });

  let array = undefined;
  if (data.b64int !== undefined) {
    const bd = base64js.toByteArray(data.b64int);
    array = new ARRAY_TYPES["INT32"](bd.buffer);
  } else if (data.b64dbl !== undefined) {
    const bd = base64js.toByteArray(data.b64dbl);
    array = new ARRAY_TYPES["FLOAT64"](bd.buffer);
  }

  let dtime = undefined;
  if (data.seconds) {
    const datetime = new Date(0);
    datetime.setSeconds(data.seconds);
    dtime = new DTime(datetime);
  }

  let stringVal = undefined;
  if (data.value !== undefined) {
    stringVal = data.value.toString();
  }
  return new DType(
    {
      stringValue: stringVal,
      doubleValue: data.value,
      arrayValue: array
    },
    alarm,
    dtime,
    ddisplay,
    // PVWS only returns changed values so these DTypes are
    // always partial.
    true
  );
}

export class PvwsPlugin implements Connection {
  private wsProtocol = "ws";
  private onConnectionUpdate: ConnectionChangedCallback;
  private onValueUpdate: ValueChangedCallback;
  private connected: boolean;
  private disconnected: string[] = [];
  private subscriptions: { [pvName: string]: boolean };
  private url = "";
  private socket!: WebSocket;
  private reconnect_ms = 5000;

  public constructor(socket: string, ssl: boolean) {
    if (ssl) {
      this.wsProtocol = "wss";
    }
    this.url = `${this.wsProtocol}://${socket}/pvws/pv`;
    this.open(false);
    this.onConnectionUpdate = nullConnCallback;
    this.onValueUpdate = nullValueCallback;
    this.connected = false;
    this.subscriptions = {};
  }

  /** Open the web socket, i.e. start PV communication */
  private open(reconnection: boolean) {
    this.socket = new WebSocket(this.url);
    this.socket.onopen = event => this.handleConnection();
    this.socket.onmessage = event => this.handleMessage(event.data);
    this.socket.onclose = event => this.handleClose(event);
    this.socket.onerror = event => this.handleError(event);

    if (reconnection) {
      this.connected = true;
    }
  }

  private handleConnection() {
    log.debug("Connected to " + this.url);
    while (this.disconnected.length) {
      const pvName = this.disconnected.pop();
      if (pvName !== undefined) {
        this.subscribe(pvName);
        this.subscriptions[pvName] = true;
      }
    }
  }

  private handleMessage(message: string) {
    const jm = JSON.parse(message);
    if (jm.type === "update") {
      if (jm.readonly !== undefined) {
        this.onConnectionUpdate(jm.pv, {
          isConnected: true,
          isReadonly: jm.readonly
        });
      }

      const dtype = pvwsToDType(jm);
      this.onValueUpdate(jm.pv, dtype);
    }
  }

  private handleError(event: Event) {
    log.error("Error from " + this.url);
    this.close();
  }

  private handleClose(event: CloseEvent) {
    let message = "Web socket closed (" + event.code;
    if (event.reason) {
      message += ", " + event.reason;
    }
    message += ")";
    log.debug(message);
    log.debug(
      "Scheduling re-connect to " + this.url + " in " + this.reconnect_ms + "ms"
    );

    if (this.connected) {
      for (const pvName of Object.keys(this.subscriptions)) {
        // Websocket closed so set connection status to disconnected and
        // readonly
        this.onConnectionUpdate(pvName, {
          isConnected: false,
          isReadonly: true
        });
        this.unsubscribe(pvName);
        this.disconnected.push(pvName);
      }
    }
    this.connected = false;
    setTimeout(() => this.open(true), this.reconnect_ms);
  }

  private close() {
    this.socket.close();
  }

  public connect(
    connectionCallback: ConnectionChangedCallback,
    valueCallback: ValueChangedCallback
  ): void {
    this.onConnectionUpdate = connectionCallback;
    this.onValueUpdate = valueCallback;
    this.connected = true;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  private _subscribe(pvName: string) {
    this.socket.send(JSON.stringify({ type: "subscribe", pvs: [pvName] }));
  }

  public subscribe(pvName: string, type?: SubscriptionType): string {
    // TODO: How to handle multiple subscriptions of different types to the same channel?
    if (this.subscriptions[pvName] === undefined) {
      this._subscribe(pvName);
      this.subscriptions[pvName] = true;
    }
    return pvName;
  }

  public getDevice(device: string): void {
    //console.log("Not implemented");
  }

  public putPv(pvName: string, value: DType): void {
    if (value.value.stringValue === undefined) {
      this.socket.send(
        JSON.stringify({
          type: "write",
          pv: pvName,
          value: value.value.doubleValue
        })
      );
    } else {
      this.socket.send(
        JSON.stringify({
          type: "write",
          pv: pvName,
          value: value.value.stringValue
        })
      );
    }
  }

  public unsubscribe(pvName: string): void {
    // Note that connectionMiddleware handles multiple subscriptions
    // for the same PV at present, so if this method is called then
    // there is no further need for this PV.
    if (this.subscriptions[pvName]) {
      this.socket.send(JSON.stringify({ type: "clear", pvs: [pvName] }));
      delete this.subscriptions[pvName];
    }
  }
}
