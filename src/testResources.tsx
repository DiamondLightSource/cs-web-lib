import React from "react";
import { FileProvider, PageState, TabState } from "./misc/fileContext";
import { render, RenderResult } from "@testing-library/react";
import { Provider } from "react-redux";
import { MacroContext } from "./types/macros";
import { CsState, initialCsState } from "./redux/csState";
import { configureStore } from "@reduxjs/toolkit";

import { BrowserRouter as Router } from "react-router";
import {
  OPEN_WEBPAGE,
  WidgetAction,
  WritePv,
  WRITE_PV
} from "./ui/widgets/widgetActions";
import { DAlarm, DAlarmNONE, DType, newDType } from "./types/dtypes";
import { rootReducer } from "./redux/store";
import {
  initialNotificationsState,
  NotificationStack
} from "./redux/notificationsSlice";

// Helper functions for dtypes.
export function ddouble(
  doubleValue: number,
  alarm: DAlarm = DAlarmNONE()
): DType {
  return newDType({ doubleValue: doubleValue }, alarm);
}

export function ddoubleArray(
  arrayValue: number[],
  alarm: DAlarm = DAlarmNONE()
): DType {
  return newDType({ arrayValue: Float64Array.from(arrayValue) }, alarm);
}

export function dstring(
  stringValue: string,
  alarm: DAlarm = DAlarmNONE()
): DType {
  return newDType({ stringValue: stringValue }, alarm);
}

// Test actions
export const WRITE_PV_ACTION: WritePv = {
  type: WRITE_PV,
  writePvInfo: {
    pvName: "PV",
    value: "value",
    description: "write value to PV"
  }
};

export const WRITE_PV_ACTION_NO_DESC: WritePv = {
  type: WRITE_PV,
  writePvInfo: {
    pvName: "PV",
    value: "value"
  }
};

export const OPEN_BBC_ACTION: WidgetAction = {
  type: OPEN_WEBPAGE,
  openWebpageInfo: { url: "https://bbc.co.uk", description: "BBC" }
};

export const ACTIONS_EX_AS_ONE = {
  actions: [WRITE_PV_ACTION, WRITE_PV_ACTION_NO_DESC],
  executeAsOne: true
};

export const ACTIONS_EX_FIRST = {
  actions: [WRITE_PV_ACTION, WRITE_PV_ACTION_NO_DESC],
  executeAsOne: false
};

export const createRootStoreState = (
  csState?: CsState,
  notifications?: NotificationStack
) => ({
  cs: csState ?? initialCsState,
  notifications: notifications ?? initialNotificationsState
});

export const contextWrapperGenerator = (
  initialPageState: PageState = {},
  initialTabState: TabState = {},
  initialRootStoreState = createRootStoreState(),
  initialContextMacros = {}
): ((props: { child: JSX.Element }) => JSX.Element) => {
  // eslint-disable-next-line no-template-curly-in-string
  const contextMacros = { a: "A", b: "B", c: "C", e: "${a}" };
  const globalMacros = { c: "D", d: "E" };

  const extendedGlobalMacros = {
    ...globalMacros,
    ...initialRootStoreState?.cs?.globalMacros
  };

  const macroContext = {
    macros: { ...contextMacros, ...initialContextMacros },
    updateMacro: (): void => {}
  };

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initialRootStoreState,
      cs: { ...initialRootStoreState.cs, globalMacros: extendedGlobalMacros }
    }
  });

  const ContextWrapper = (props: { child: JSX.Element }): JSX.Element => (
    <Router>
      <Provider store={store}>
        <MacroContext.Provider value={macroContext}>
          <FileProvider
            initialPageState={initialPageState}
            initialTabState={initialTabState}
          >
            {props.child}
          </FileProvider>
        </MacroContext.Provider>
      </Provider>
    </Router>
  );

  ContextWrapper.displayName = "ContextWrapper";

  return ContextWrapper;
};

export const contextRender = (
  component: JSX.Element,
  initialPageState: PageState = {},
  initialTabState: TabState = {},
  initialRootStoreState = createRootStoreState(),
  initialContextMacros = {}
): RenderResult => {
  const WrapperComponent = contextWrapperGenerator(
    initialPageState,
    initialTabState,
    initialRootStoreState,
    initialContextMacros
  );
  return render(<WrapperComponent child={component} />);
};
