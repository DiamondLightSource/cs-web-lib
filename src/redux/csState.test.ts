import csReducer, {
  connectionChanged,
  CsState,
  deviceQueried,
  subscribe,
  valueChanged,
  valuesChanged,
  unsubscribe,
  fileChanged,
  refreshFile
} from "./csState";
import {
  DType,
  dTypeGetAlarm,
  dTypeGetArrayValue,
  dTypeGetDoubleValue,
  dTypeGetStringValue,
  newDType
} from "../types/dtypes/dType";
import { ddouble, dstring, ddoubleArray } from "../testResources";
import { WidgetDescription } from "../ui/widgets/createComponent";
import { AbsolutePosition } from "../types";
import { AlarmQuality, DAlarmMAJOR, newDAlarm } from "../types/dtypes/dAlarm";

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
      position: new AbsolutePosition("0", "0", "0", "0")
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
      position: new AbsolutePosition("0", "0", "0", "0")
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
