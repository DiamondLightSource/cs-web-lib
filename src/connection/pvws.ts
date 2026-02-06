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

import { DTime, DDisplay, DRange } from "../types/dtypes";
import { DType, newDType } from "../types/dtypes/dType";
import { AlarmQuality, newDAlarm } from "../types/dtypes/dAlarm";
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
      alarm = newDAlarm(AlarmQuality.ALARM, "");
    } else if (data.severity === "MINOR") {
      alarm = newDAlarm(AlarmQuality.WARNING, "");
    } else {
      alarm = newDAlarm(AlarmQuality.VALID, "");
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
  } else if (data.b64flt !== undefined) {
    const bd = base64js.toByteArray(data.b64flt);
    array = new ARRAY_TYPES["FLOAT32"](bd.buffer);
  } else if (data.b64srt !== undefined) {
    const bd = base64js.toByteArray(data.b64srt);
    array = new ARRAY_TYPES["INT16"](bd.buffer);
  } else if (data.b64byt !== undefined) {
    const bd = base64js.toByteArray(data.b64byt);
    array = new ARRAY_TYPES["INT8"](bd.buffer);
  }

  let dtime = undefined;
  if (data.seconds) dtime = new DTime(new Date(data.seconds * 1000));

  let stringVal = undefined;
  if (data.text !== undefined) {
    stringVal = data.text;
  } else if (data.value !== undefined) {
    stringVal = data.value.toString();
  }
  return newDType(
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
  private initMsgRcvd: { [pvName: string]: boolean };
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
    this.initMsgRcvd = {};
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
      let updateConnection = false;
      // PVWS only sends the readonly attribute if false
      // so set true by default and update later.
      let readonly = true;
      if (!this.initMsgRcvd[jm.pv]) {
        updateConnection = true;
        this.initMsgRcvd[jm.pv] = true;
      } else if (jm.readonly !== undefined) {
        updateConnection = true;
        // Update readonly from PVWS message
        readonly = jm.readonly;
      }
      if (updateConnection) {
        this.onConnectionUpdate(jm.pv, {
          isConnected: true,
          isReadonly: readonly
        });
      }

      const dtype = pvwsToDType(jm);
      this.onValueUpdate(jm.pv, dtype);
    }
  }

  private sendMessage(message: string) {
    if (this.socket.readyState === 1) {
      // Socket is set up, we can send message
      this.socket.send(message);
    } else if (!this.socket.readyState) {
      // Socket is not set up, wait until open to send message
      this.socket.addEventListener("open", _ev => {
        this.socket.send(message);
      });
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
    this.sendMessage(JSON.stringify({ type: "subscribe", pvs: [pvName] }));
  }

  public subscribe(pvName: string, type?: SubscriptionType): string {
    // TODO: How to handle multiple subscriptions of different types to the same channel?
    if (this.subscriptions[pvName] === undefined) {
      this._subscribe(pvName);
      this.subscriptions[pvName] = true;
      this.initMsgRcvd[pvName] = false;
    }
    return pvName;
  }

  public getDevice(device: string): void {
    //console.log("Not implemented");
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

  public unsubscribe(pvName: string): void {
    // Note that connectionMiddleware handles multiple subscriptions
    // for the same PV at present, so if this method is called then
    // there is no further need for this PV.
    if (this.subscriptions[pvName]) {
      this.sendMessage(JSON.stringify({ type: "clear", pvs: [pvName] }));
      delete this.subscriptions[pvName];
    }
  }
}
