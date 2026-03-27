import base64js from "base64-js";
import {
  DType,
  newDAlarm,
  AlarmQuality,
  newDDisplay,
  newDRange,
  newDTime,
  newDType
} from "../types/dtypes";

export const ARRAY_TYPES = {
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

export const pvwsToDType = (data: any): DType => {
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
};
