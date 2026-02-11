import { CsState, PvState, FullPvState } from "../../redux/csState";
import { ColorUtils } from "../../types/color";
import { newDType } from "../../types/dtypes";
import { newAbsolutePosition } from "../../types/position";
import { WidgetDescription } from "../widgets/createComponent";
import {
  pvStateSelector,
  pvStateComparator,
  PvArrayResults,
  deviceSelector,
  deviceComparator,
  fileSelector,
  fileComparator
} from "./utils";

const pv1 = "pv1";
const pv2 = "pv2";
const pv3 = "pv3";
const pvState: FullPvState = {
  value: undefined,
  connected: true,
  readonly: true,
  initializingPvName: pv1
};

const state: CsState = {
  valueCache: { pv1: pvState },
  globalMacros: {},
  effectivePvNameMap: { pv1: "pv1", pv2: "pv3" },
  subscriptions: {},
  deviceCache: {},
  fileCache: {}
};

describe("pvStateSelector", (): void => {
  it("returns appropriate values if PV present", (): void => {
    const results = pvStateSelector([pv1], state);
    const [pvState, effectivePv] = results[pv1];
    expect(pvState).toEqual(pvState);
    expect(effectivePv).toEqual(pv1);
  });

  it("returns correct effective PV name", (): void => {
    const results = pvStateSelector([pv2], state);
    const [pvState, effectivePv] = results[pv2];
    expect(pvState).toBeUndefined();
    expect(effectivePv).toEqual(pv3);
  });

  it("returns appropriate values if PV not present", (): void => {
    const results = pvStateSelector(["not-a-pv"], state);
    const [pvState, shortName] = results["not-a-pv"];
    expect(pvState).toBeUndefined();
    expect(shortName).toEqual("not-a-pv");
  });
});

describe("pvStateComparator", (): void => {
  const singleResult: PvArrayResults = {
    pv1: [pvState, "pv1"]
  };

  it("returns true if the same object is passed twice", (): void => {
    expect(pvStateComparator(singleResult, singleResult)).toBe(true);
  });

  it("returns false if results are for a different PV", (): void => {
    const otherResult: PvArrayResults = {
      pv2: [pvState, "pv2"]
    };
    expect(pvStateComparator(singleResult, otherResult)).toBe(false);
  });

  it("returns true if different objects have a reference to the same PvState objects", (): void => {
    const anotherSingleResult: PvArrayResults = {
      pv1: [pvState, "pv1"]
    };
    expect(pvStateComparator(singleResult, anotherSingleResult)).toBe(true);
  });

  it("returns false if different objects have a reference to different PvState objects", (): void => {
    const similarPvState: PvState = {
      value: undefined,
      connected: true,
      readonly: true
    };
    const anotherSingleResult: PvArrayResults = {
      pv1: [similarPvState, "pv1"]
    };
    expect(pvStateComparator(singleResult, anotherSingleResult)).toBe(false);
  });
});

describe("deviceComparator", (): void => {
  it("returns false if string values don't match", (): void => {
    const dtype1 = newDType({ stringValue: "42" });
    const dtype2 = newDType({ stringValue: "43" });
    expect(deviceComparator(dtype1, dtype2)).toBe(false);
  });

  it("returns true if string values do match", (): void => {
    const dtype = newDType({ stringValue: "42" });
    expect(deviceComparator(dtype, dtype)).toBe(true);
  });
});

describe("deviceSelector", (): void => {
  it("finds device in deviceCache", (): void => {
    const dtype = newDType({ stringValue: "testDeviceValue" });
    state.deviceCache["testDevice"] = dtype;

    expect(deviceSelector("testDevice", state)).toEqual(dtype);
  });

  it("returns undefined if device not in cache", (): void => {
    state.deviceCache = {};
    expect(deviceSelector("testDevice", state)).toBeUndefined();
  });
});

describe("fileComparator", (): void => {
  it("returns false if string contents don't match", (): void => {
    const contents1: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    const contents2: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("1", "0", "0", "0")
    };
    expect(fileComparator(contents1, contents2)).toBe(false);
  });

  it("returns false if number of keys changed", (): void => {
    const contents1: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0"),
      backgroundColor: ColorUtils.TRANSPARENT
    };
    const contents2: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };

    expect(fileComparator(contents1, contents2)).toBe(false);
  });

  it("returns true if matches", (): void => {
    const contents: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    expect(fileComparator(contents, { ...contents })).toBe(true);
  });
});

describe("fileSelector", (): void => {
  it("finds file in fileCache", (): void => {
    const contents: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    state.fileCache["test.bob"] = contents;

    expect(fileSelector("test.bob", state)).toEqual(contents);
  });

  it("returns undefined if device not in cache", (): void => {
    state.deviceCache = {};
    expect(fileSelector("test2.bob", state)).toBeUndefined();
  });
});
