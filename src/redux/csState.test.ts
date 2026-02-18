import csReducer, {
  connectionChanged,
  CsState,
  deviceQueried,
  subscribe,
  valueChanged,
  valuesChanged,
  unsubscribe,
  fileChanged,
  refreshFile,
  selectPvStates,
  pvStateComparator,
  selectDevice,
  fileComparator,
  selectFile,
  FullPvState,
  PvState,
  deviceComparator,
  PvArrayResults
} from "./csState";
import {
  DType,
  dTypeGetAlarm,
  dTypeGetArrayValue,
  dTypeGetDoubleValue,
  dTypeGetStringValue,
  newDType,
  AlarmQuality,
  DAlarmMAJOR,
  newDAlarm
} from "../types/dtypes";
import {
  ddouble,
  dstring,
  ddoubleArray,
  createRootStoreState
} from "../testResources";
import { WidgetDescription } from "../ui/widgets/createComponent";
import { newAbsolutePosition } from "../types/position";
import { ColorUtils } from "../types";

const initialState: CsState = {
  valueCache: {
    PV: {
      value: ddouble(0),
      connected: true,
      readonly: false,
      initializingPvName: ""
    }
  },
  globalMacros: {},
  subscriptions: {},
  effectivePvNameMap: {},
  deviceCache: {},
  fileCache: {
    "mySecondFile.bob": {
      type: "ellipse",
      position: newAbsolutePosition("0", "0", "0", "0")
    }
  }
};

describe("VALUES_CHANGED", (): void => {
  test("csReducer honours latest of multiple value updates", (): void => {
    const action: ReturnType<typeof valuesChanged> = {
      type: "cs/valuesChanged",
      payload: [
        {
          type: "cs/valueChanged",
          payload: { pvName: "PV", value: ddouble(1) }
        },
        {
          type: "cs/valueChanged",
          payload: { pvName: "PV", value: ddouble(2) }
        }
      ]
    };
    const newState = csReducer(initialState, action);
    // expect the latter value
    expect(newState.valueCache["PV"].value).not.toBeUndefined();
    expect(
      dTypeGetDoubleValue(newState.valueCache["PV"].value as DType)
    ).toEqual(2);
  });
  test("csReducer merges multiple value updates", (): void => {
    const action: ReturnType<typeof valuesChanged> = {
      type: "cs/valuesChanged",
      payload: [
        {
          type: "cs/valueChanged",
          payload: { pvName: "PV", value: ddouble(1) }
        },
        {
          type: "cs/valueChanged",
          payload: {
            pvName: "PV",
            value: newDType(
              {},
              newDAlarm(AlarmQuality.ALARM, ""),
              undefined,
              undefined,
              true
            )
          }
        }
      ]
    };
    const newState = csReducer(initialState, action);
    // value from first update and alarm from second update
    expect(
      dTypeGetDoubleValue(newState.valueCache["PV"].value as DType)
    ).toEqual(1);
    expect(
      dTypeGetAlarm(newState.valueCache["PV"].value as DType).quality
    ).toEqual(AlarmQuality.ALARM);
  });
});

describe("VALUE_CHANGED", (): void => {
  test("csReducer handles value update", (): void => {
    const action: ReturnType<typeof valueChanged> = {
      type: "cs/valueChanged",
      payload: { pvName: "PV", value: ddouble(1) }
    };
    const newState = csReducer(initialState, action);
    expect(
      dTypeGetDoubleValue(newState.valueCache["PV"].value as DType)
    ).toEqual(1);
  });

  test("csReducer handles alarm update", (): void => {
    const majorAlarm = DAlarmMAJOR();
    const action: ReturnType<typeof valueChanged> = {
      type: "cs/valueChanged",
      payload: {
        pvName: "PV",
        value: ddouble(0, majorAlarm)
      }
    };
    const newState = csReducer(initialState, action);
    const newValue = newState.valueCache["PV"].value;
    expect(dTypeGetAlarm(newValue)).toEqual(majorAlarm);
  });

  test("csReducer handles type update", (): void => {
    const action: ReturnType<typeof valueChanged> = {
      type: "cs/valueChanged",
      payload: {
        pvName: "PV",
        value: dstring("hello")
      }
    };
    const newState = csReducer(initialState, action);
    const newValue = newState.valueCache["PV"].value;
    expect(dTypeGetStringValue(newValue as DType)).toEqual("hello");
  });

  test("csReducer handles array type update", (): void => {
    const action: ReturnType<typeof valueChanged> = {
      type: "cs/valueChanged",
      payload: {
        pvName: "PV",
        value: ddoubleArray([1, 2, 3])
      }
    };
    const newState = csReducer(initialState, action);
    const newValue = newState.valueCache["PV"].value;
    expect(dTypeGetArrayValue(newValue as DType)).toEqual(
      Float64Array.from([1, 2, 3])
    );
  });
});

describe("CONNECTION_CHANGED", (): void => {
  test("csReducer handles value update", (): void => {
    const action: ReturnType<typeof connectionChanged> = {
      type: "cs/connectionChanged",
      payload: { pvName: "PV", value: { isConnected: false, isReadonly: true } }
    };
    const newState = csReducer(initialState, action);
    expect(newState.valueCache["PV"].connected).toEqual(false);
  });
});

describe("DEVICE_QUERIED", (): void => {
  test("csReducer adds device to deviceCache", (): void => {
    const dtype = newDType({ stringValue: "42" });
    const deviceName = "testDevice";
    const action: ReturnType<typeof deviceQueried> = {
      type: "cs/deviceQueried",
      payload: { device: deviceName, value: dtype }
    };

    const newState = csReducer(initialState, action);
    expect(newState.deviceCache[deviceName]).toEqual(dtype);
  });
});

test("handles initializers", (): void => {
  const action: ReturnType<typeof subscribe> = {
    type: "cs/subscribe",
    payload: {
      pvName: "PV(1)",
      effectivePvName: "PV",
      componentId: "0",
      type: { double: true }
    }
  };
  const action2: ReturnType<typeof subscribe> = {
    type: "cs/subscribe",
    payload: {
      pvName: "PV(1)",
      effectivePvName: "PV",
      componentId: "1",
      type: { double: true }
    }
  };
  const state2 = csReducer(initialState, action);
  const state3 = csReducer(state2, action2);
  expect(state3.effectivePvNameMap["PV(1)"]).toEqual("PV");

  const unsubAction: ReturnType<typeof unsubscribe> = {
    type: "cs/unsubscribe",
    payload: { pvName: "PV(1)", componentId: "0" }
  };

  const unsubAction2: ReturnType<typeof unsubscribe> = {
    type: "cs/unsubscribe",
    payload: { pvName: "PV(1)", componentId: "1" }
  };

  const state4 = csReducer(state3, unsubAction);
  expect(state4.effectivePvNameMap["PV(1)"]).toEqual("PV");
  const state5 = csReducer(state4, unsubAction2);
  expect(state5.effectivePvNameMap["PV(1)"]).toEqual(undefined);
});

describe("FILE_CHANGED", (): void => {
  test("csReducer adds file to fileCache", (): void => {
    const contents: WidgetDescription = {
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    const fileName = "myfile.bob";
    const action: ReturnType<typeof fileChanged> = {
      type: "cs/fileChanged",
      payload: { file: fileName, contents: contents }
    };

    const newState = csReducer(initialState, action);
    expect(newState.fileCache[fileName]).toEqual(contents);
  });
});

describe("REFRESH_FILE", (): void => {
  test("csReducer deletes the file entry from fileCache", (): void => {
    const fileName = "mySecondFile.bob";
    const action: ReturnType<typeof refreshFile> = {
      type: "cs/refreshFile",
      payload: { file: fileName }
    };

    const newState = csReducer(initialState, action);
    expect(newState.fileCache[fileName]).toBeUndefined();
  });
});

describe("Selectors", () => {
  const pv1 = "pv1";
  const pv2 = "pv2";
  const pv3 = "pv3";
  const pvState: FullPvState = {
    value: undefined,
    connected: true,
    readonly: true,
    initializingPvName: pv1
  };

  const testCsState: CsState = {
    valueCache: { pv1: pvState },
    globalMacros: {},
    effectivePvNameMap: { pv1: "pv1", pv2: "pv3" },
    subscriptions: {},
    deviceCache: {},
    fileCache: {}
  };

  const state = createRootStoreState(testCsState);

  describe("selectPvStates", (): void => {
    it("returns appropriate values if PV present", (): void => {
      const results = selectPvStates(state, [pv1]);
      const [pvState, effectivePv] = results[pv1];
      expect(pvState).toEqual(pvState);
      expect(effectivePv).toEqual(pv1);
    });

    it("returns correct effective PV name", (): void => {
      const results = selectPvStates(state, [pv2]);
      const [pvState, effectivePv] = results[pv2];
      expect(pvState).toBeUndefined();
      expect(effectivePv).toEqual(pv3);
    });

    it("returns appropriate values if PV not present", (): void => {
      const results = selectPvStates(state, ["not-a-pv"]);
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

  describe("selectDevice", (): void => {
    it("finds device in deviceCache", (): void => {
      const dtype = newDType({ stringValue: "testDeviceValue" });
      const localState = {
        ...state,
        cs: { ...state.cs, deviceCache: { testDevice: dtype } }
      };
      expect(selectDevice(localState, "testDevice")).toEqual(dtype);
    });

    it("returns undefined if device not in cache", (): void => {
      const localState = { ...state, cs: { ...state.cs, deviceCache: {} } };
      expect(selectDevice(localState, "testDevice")).toBeUndefined();
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

  describe("selectFile", (): void => {
    it("finds file in fileCache", (): void => {
      const contents: WidgetDescription = {
        type: "shape",
        position: newAbsolutePosition("0", "0", "0", "0")
      };
      state.cs.fileCache["test.bob"] = contents;

      expect(selectFile(state, "test.bob")).toEqual(contents);
    });

    it("returns undefined if device not in cache", (): void => {
      const localState = { ...state, cs: { ...state.cs, fileCache: {} } };
      expect(selectFile(localState, "test2.bob")).toBeUndefined();
    });
  });
});
