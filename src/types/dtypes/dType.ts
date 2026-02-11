import { DTypeValue, NumberArray } from "./dTypeValue";
import { mergeDDisplay, DDisplay, dDisplayNONE } from "./dDisplay";
import { DTime } from "./dTime";
import { DAlarm, DAlarmNONE } from "./dAlarm";

export interface DType {
  value: DTypeValue;
  time?: DTime;
  alarm?: DAlarm;
  display: DDisplay;
  partial: boolean;
}

export const newDType = (
  value: DTypeValue,
  alarm?: DAlarm,
  time?: DTime,
  display?: DDisplay,
  partial?: boolean
): DType => ({
  value,
  alarm,
  time,
  display: display ?? dDisplayNONE,
  partial: partial ?? false
});

export const dTypeGetStringValue = (
  dType: DType | undefined
): string | undefined => {
  // eslint-disable-next-line eqeqeq
  if (dType?.value?.stringValue != null) {
    return dType.value.stringValue;
    // eslint-disable-next-line eqeqeq
  } else if (dType?.value?.doubleValue != null && dType.display?.choices) {
    return dType.display.choices[dType.value.doubleValue];
  }

  return dType?.value?.stringValue;
};

/**
 * Tries to convert a DType into a string by first converting to
 * an intermediary value (first tried is string, then double, then array)
 * @param dType
 */
export const dTypeCoerceString = (dType?: DType): string => {
  if (dType) {
    const stringValue = dTypeGetStringValue(dType);
    const doubleValue = dTypeGetDoubleValue(dType);
    const arrayValue = dTypeGetArrayValue(dType);
    if (stringValue !== undefined) {
      return stringValue;
    } else if (doubleValue !== undefined) {
      return doubleValue.toString();
    } else if (arrayValue !== undefined) {
      return arrayValue.toString();
    } else {
      return "";
    }
  } else {
    return "";
  }
};

export const dTypeGetDoubleValue = (
  dType: DType | undefined
): number | undefined => dType?.value?.doubleValue;

/**
 * Attempts to extract a doubleValue from a DType through an
 * intermediary conversion (first tried is double, then string)
 * @param dType
 */
export const dTypeCoerceDouble = (dType?: DType): number => {
  if (dType !== undefined) {
    const doubleValue = dTypeGetDoubleValue(dType);
    const stringValue = dTypeGetStringValue(dType);
    if (typeof doubleValue === "number") {
      return doubleValue;
    } else if (stringValue !== undefined) {
      // Returns NaN if cannot parse.
      return Number(stringValue);
    } else {
      return NaN;
    }
  } else {
    return NaN;
  }
};

export const dTypeGetArrayValue = (
  dType: DType | undefined
): NumberArray | undefined => dType?.value?.arrayValue;

/**
 * Attempts to extract a arrayValue from a DType through an
 * intermediary conversion (first tried is array, then double)
 * @param dType
 */
export const dTypeCoerceArray = (dType: DType): NumberArray => {
  const arrayValue = dTypeGetArrayValue(dType);
  const doubleValue = dTypeGetDoubleValue(dType);
  if (arrayValue !== undefined) {
    return arrayValue;
  } else if (doubleValue !== undefined) {
    return Float64Array.from([doubleValue]);
  } else {
    return Float64Array.from([]);
  }
};

export const dTypeByteArrToString = (arr: NumberArray): string => {
  let result = "";
  for (let i = 0; i < arr.length; i++) {
    if (Number(arr[i]) === 0) {
      break;
    }
    result += String.fromCharCode(Number(arr[i]));
  }
  return result;
};

export const dTypeGetStringArrayValue = (dType: DType): string[] | undefined =>
  dType.value.stringArray;

export const dTypeGetAlarm = (dType: DType | undefined): DAlarm =>
  dType?.alarm ?? DAlarmNONE();

export const dTypeGetTime = (dType: DType | undefined): DTime | undefined =>
  dType?.time;

export const dTypeGetDisplay = (
  dType: DType | undefined
): DDisplay | undefined => dType?.display;

export const dTypeToString = (dType: DType | undefined): string =>
  `DType: ${dTypeCoerceString(dType)}`;

export const mergeDType = (
  original: DType | undefined,
  update: DType
): DType => {
  if (!update.partial) {
    return update;
  } else {
    return newDType(
      {
        stringValue: update.value.stringValue ?? original?.value.stringValue,
        doubleValue: update.value.doubleValue ?? original?.value.doubleValue,
        arrayValue: update.value.arrayValue ?? original?.value.arrayValue
      },

      update.alarm ?? original?.alarm,
      update.time ?? original?.time,
      mergeDDisplay(original?.display, update.display)
    );
  }
};
