/* Module that handles a GraphQL connection to the PVWS server.
   See https://github.com/ornl-epics/pvws
 */
import base64js from "base64-js";
import { Connection, SubscriptionType } from "./plugin";

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

export class PvwsPlugin implements Connection {
  private CLOSE_SOCKET_FOR_SERVICE_SWITCH = 3001;
  private wsProtocol = "ws";
  
  private subscriptions: { [pvName: string]: boolean };
  private dispatch: Dispatch;
  
  private fallbackUrl: string;
  private reconnect_ms = 500;
  private client: PvwsClient;

  public constructor(socket: string, ssl: boolean, dispatch: Dispatch) {
    if (ssl) {
      this.wsProtocol = "wss";
    }
    this.fallbackUrl = `${this.wsProtocol}://${socket}/pvws/pv`;
    this.subscriptions = {};
    this.dispatch = dispatch;

    this.client = this.newConnection(this.fallbackUrl);
  }

  handleConnection = () => {
    log.debug("Connected to " + this.fallbackUrl);
    for (const pvName of Object.keys(this.subscriptions)) {
      // reinstate the existing subscriptions
      this.subscribe(pvName);
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

  private sendMessage(message: string) {
    if (!this.client) {
      log.error("Attempted to send message when not connected to a websocket.");
    }

    this.client?.sendMessage(message);
  }

  handleClose = (event: CloseEvent) => {
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
  
    if (event.code !== this.CLOSE_SOCKET_FOR_SERVICE_SWITCH) {
      log.debug(
        "Scheduling re-connect to " +
          this.fallbackUrl +
          " in " +
          this.reconnect_ms +
          "ms"
      );

      setTimeout(() => {
        this.client = this.newConnection(this.client?.getUrl() ?? this.fallbackUrl);
      }, this.reconnect_ms);
    }
  };

  public subscribe(pvName: string, type?: SubscriptionType): string {
    // TODO: How to handle multiple subscriptions of different types to the same channel?
    if (!this.subscriptions[pvName] ) {
      this.sendMessage(JSON.stringify({ type: "subscribe", pvs: [pvName] }));
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
          if(socketUrl != this.client?.getUrl()) {
            this.client.close(
              this.CLOSE_SOCKET_FOR_SERVICE_SWITCH,
              "Closing socket for PVWS service endpoint change"
            );          
            this.client = this.newConnection(socketUrl);
          }
        });
    } else {
      this.client.close(
        this.CLOSE_SOCKET_FOR_SERVICE_SWITCH,
        "Closing socket for PVWS service endpoint change"
      );
      // New hostname is undefined, connect to the fallback PVWS service.
      this.client = this.newConnection(this.fallbackUrl);
    }
  }

  private newConnection(url: string) {
    return new PvwsClient(
      url,
      this.handleConnection,
      this.handleMessage,
      this.handleClose
    );
  }
}
