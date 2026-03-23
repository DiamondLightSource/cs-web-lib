/* Module that handles a GraphQL connection to the PVWS server.
   See https://github.com/ornl-epics/pvws
 */
import base64js from "base64-js";
import { Connection, SubscriptionType, ConnectionState } from "./plugin";

import {
  newDRange,
  newDDisplay,
  newDTime,
  DType,
  newDType,
  AlarmQuality,
  newDAlarm
} from "../types/dtypes";
import log from "loglevel";
import { PvwsClient } from "./pvwsClient";
import { Dispatch } from "@reduxjs/toolkit";
import {
  connectionChanged,
  deviceQueried,
  connectionClosed,
  valueChanged
} from "../redux/csState";
import { notificationDispatcher } from "../redux/notificationUtils";

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
  ddisplay = newDDisplay({
    description: undefined,
    role: undefined,
    controlRange: undefined,
    alarmRange: data.alarm_low
      ? newDRange(data.alarm_low, data.alarm_high)
      : undefined,
    warningRange: data.warn_low
      ? newDRange(data.warn_low, data.warn_high)
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
  if (data.seconds) dtime = newDTime(new Date(data.seconds * 1000));

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

function connectionChangedDispatch(
  dispatch: Dispatch | undefined,
  pvName: string,
  value: ConnectionState
): void {
  if (dispatch) {
    dispatch(connectionChanged({ pvName, value }));
  }
}

function valueChangedDispatch(
  dispatch: Dispatch | undefined,
  pvName: string,
  value: DType
): void {
  if (dispatch) {
    dispatch(valueChanged({ pvName, value }));
  }
}

function deviceQueriedDispatch(
  dispatch: Dispatch | undefined,
  device: string,
  value: DType
): void {
  if (dispatch) {
    dispatch(deviceQueried({ device, value }));
  }
}

export class PvwsPlugin implements Connection {
  private wsProtocol = "ws";
  private disconnected: Set<string> = new Set<string>();
  private subscriptions: { [pvName: string]: boolean };
  private url = "";
  private reconnect_ms = 500;
  private dispatch: Dispatch | undefined;
  private client: PvwsClient | undefined;

  public constructor(socket: string, ssl: boolean) {
    if (ssl) {
      this.wsProtocol = "wss";
    }
    this.url = `${this.wsProtocol}://${socket}/pvws/pv`;
    this.subscriptions = {};

    this.client = new PvwsClient(
      this.url,
      this.handleConnection,
      this.handleMessage,
      this.handleClose,
      this.handleError
    );
  }

  public setDispatch(dispatch: Dispatch) {
    if (!this.dispatch) {
      console.log("setDispatch" + !!dispatch);
      this.dispatch = dispatch;
    }
  }

  handleConnection = () => {
    log.debug("Connected to " + this.url);
    console.log("Connected to " + this.url);
    console.log(this.disconnected);
    while (this.disconnected.size) {
      const pvName = this.disconnected.values().next().value;
      if (pvName !== undefined) {
        this.disconnected.delete(pvName);
        console.log("handleConnection subscribe: " + pvName);
        this.subscribe(pvName);
        this.subscriptions[pvName] = true;
      }
    }
  };

  handleMessage = (event: MessageEvent) => {
    const jm = JSON.parse(event.data);
    if (jm.type === "update") {
      connectionChangedDispatch(this.dispatch, jm.pv, {
        isConnected: true,
        isReadonly: jm.readonly
      });

      const dtype = pvwsToDType(jm);
      valueChangedDispatch(this.dispatch, jm.pv, dtype);
    } else if (jm.type === "error") {
      if (this.dispatch) {
        const { showError } = notificationDispatcher(this.dispatch);
        showError(`${jm?.message}`);
      }

      log.error(`PVWS error message: ${jm?.message}`);
    }
  };

  private sendMessage(message: string) {
    if (!this.client) {
      log.error("Attempted to send message when not connected to a websocket.");
    }

    this.client?.sendMessage(message);
  }

  handleError = (event: Event) => {
    log.error("Error from " + this.url);
    this.client?.close();
  };

  handleClose = (event: CloseEvent) => {
    let message = "Web socket closed (" + event.code;
    if (event.reason) {
      message += ", " + event.reason;
    }
    message += ")";
    log.debug(message);
    log.debug(
      "Scheduling re-connect to " + this.url + " in " + this.reconnect_ms + "ms"
    );

    for (const pvName of Object.keys(this.subscriptions)) {
      connectionChangedDispatch(this.dispatch, pvName, {
        isConnected: false,
        isReadonly: true
      });

      // Adding to the disconnected list
      this.disconnected.add(pvName);
    }

    // clear subscriptions
    this.subscriptions = {};

    setTimeout(() => {
      this.client = new PvwsClient(
        this.url,
        this.handleConnection,
        this.handleMessage,
        this.handleClose,
        this.handleError
      );
    }, this.reconnect_ms);
  };

  private _subscribe(pvName: string) {
    this.sendMessage(JSON.stringify({ type: "subscribe", pvs: [pvName] }));
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

  public unsubscribe(pvName: string): void {
    // Note that connectionMiddleware handles multiple subscriptions
    // for the same PV at present, so if this method is called then
    // there is no further need for this PV.
    if (this.subscriptions[pvName]) {
      this.sendMessage(JSON.stringify({ type: "clear", pvs: [pvName] }));
      delete this.subscriptions[pvName];
    }

    if (this.dispatch) {
      this.dispatch(connectionClosed({ pvName }));
    }
  }
}
