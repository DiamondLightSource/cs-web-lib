import React from "react";
import { ReadbackComponent } from "./readback";
import { DType, DDisplay, DAlarm, AlarmQuality } from "../../../types/dtypes";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";

const BASE_PROPS = {
  connected: true,
  readonly: false,
  precision: 2
};

const ReadbackRenderer = (readbackProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <ReadbackComponent {...readbackProps} />
    </ThemeProvider>
  );
};

describe("<Readback />", (): void => {
  test("numeric precision", (): void => {
    const props = {
      ...BASE_PROPS,
      value: new DType({
        stringValue: "3.14159265359",
        doubleValue: 3.1415926539
      })
    };
    const { getByRole } = render(ReadbackRenderer(props));
    // Check for precision.
    expect(getByRole("textbox").textContent).toBe("3.14");
  });

  test("string value with units", (): void => {
    const props = {
      ...BASE_PROPS,
      value: new DType(
        { stringValue: "hello" },
        undefined,
        undefined,
        new DDisplay({ units: "xyz" })
      ),
      showUnits: true
    };
    const { getByText } = render(ReadbackRenderer(props));
    // Units displayed along with the value.
    expect(getByText("hello xyz")).toBeInTheDocument();
  });

  test("alarm-sensitive foreground colour", (): void => {
    const props = {
      ...BASE_PROPS,
      value: new DType(
        { stringValue: "hello" },
        new DAlarm(AlarmQuality.ALARM, "")
      ),
      alarmSensitive: true
    };
    const { asFragment } = render(ReadbackRenderer(props));

    expect(asFragment()).toMatchSnapshot();
  });

  test("component is disabled", (): void => {
    const props = {
      ...BASE_PROPS,
      value: new DType(
        { stringValue: "hello" },
        new DAlarm(AlarmQuality.ALARM, "")
      ),
      enabled: false
    };

    const { getByText } = render(ReadbackRenderer(props));
    expect(getByText("hello")).toBeDisabled();
  });
});
