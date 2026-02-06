import { dstring, ddoubleArray, ddouble } from "../testResources";
import { DDisplay, DRange, mergeDDisplay } from "./dtypes";
import {
  dTypeCoerceArray,
  dTypeCoerceDouble,
  dTypeCoerceString,
  dTypeGetArrayValue,
  dTypeGetDoubleValue,
  dTypeGetStringValue,
  mergeDType,
  newDType
} from "./dtypes/dType";
import { DAlarmMAJOR } from "./dtypes/dAlarm";

const stringDType = dstring("hello");
const doubleDType = ddouble(42);
const arrayDType = ddoubleArray([3, 5, 0.5]);

describe("DType", (): void => {
  test("getStringValue() returns string if present", (): void => {
    expect(dTypeGetStringValue(stringDType)).toEqual("hello");
  });

  test("getDoubleValue() returns double value", (): void => {
    expect(dTypeGetDoubleValue(doubleDType)).toEqual(42);
  });

  test("getDoubleValue() returns undefined if empty", (): void => {
    expect(dTypeGetDoubleValue(stringDType)).toBeUndefined();
  });

  test("getDoubleValue() returns undefined if array type", (): void => {
    const arrayDType = ddoubleArray([1, 2, 3]);
    expect(dTypeGetDoubleValue(arrayDType)).toBeUndefined();
  });

  test("getArrayValue() returns undefined if empty", (): void => {
    expect(dTypeGetArrayValue(stringDType)).toBeUndefined();
  });
});

describe("DType coercion", (): void => {
  test("coerceDouble() returns double if defined", (): void => {
    expect(dTypeCoerceDouble(doubleDType)).toEqual(42);
  });
  test("coerceDouble() returns NaN if invalid string", (): void => {
    expect(dTypeCoerceDouble(dstring("2 or 3"))).toBeNaN();
  });

  test("coerceDouble() returns NaN if undefined", (): void => {
    expect(dTypeCoerceDouble(undefined)).toBeNaN();
  });

  test("coerceDouble() returns NaN if empty", (): void => {
    expect(dTypeCoerceDouble(stringDType)).toBeNaN();
  });

  test("coerceString() returns numeric string", (): void => {
    expect(dTypeCoerceString(doubleDType)).toEqual("42");
  });

  test("coerceString() returns string if defined", (): void => {
    expect(dTypeCoerceString(stringDType)).toEqual("hello");
  });

  test("coerceString() returns array type", (): void => {
    expect(dTypeCoerceString(arrayDType)).toEqual("3,5,0.5");
  });

  test("coerceArray() returns array if defined", (): void => {
    expect(dTypeCoerceArray(ddoubleArray([1, 2, 3]))).toEqual(
      Float64Array.from([1, 2, 3])
    );
  });
  test("coerceArray() returns array from double value", (): void => {
    expect(dTypeCoerceArray(doubleDType)).toEqual(Float64Array.from([42]));
  });
});

describe("mergeDType", (): void => {
  test("returns update if not partial", (): void => {
    const doubleDType = ddouble(3);
    expect(mergeDType(doubleDType, stringDType)).toEqual(stringDType);
  });

  test("returns merge if  update is partial", (): void => {
    const orig = newDType({ doubleValue: 3 });
    const alarmDType = newDType({}, DAlarmMAJOR(), undefined, undefined, true);
    const expected = newDType({ doubleValue: 3 }, DAlarmMAJOR());
    expect(mergeDType(orig, alarmDType)).toEqual(expected);
  });

  test("mergeDDisplay merges values", (): void => {
    const orig = new DDisplay({ units: "A" });
    const update = new DDisplay({ warningRange: new DRange(1, 2) });
    const expected = new DDisplay({
      units: "A",
      warningRange: new DRange(1, 2)
    });
    expect(mergeDDisplay(orig, update)).toEqual(expected);
  });
});
