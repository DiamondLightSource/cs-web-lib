import React from "react";
import { LedComponent, LedComponentProps } from "./led";
import { DType, newDType } from "../../../types/dtypes/dType";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { Color } from "../../../types/color";
import { ddouble } from "../../../testResources";
import { PvDatum } from "../../../redux/csState";
import { AlarmQuality, newDAlarm } from "../../../types/dtypes/dAlarm";

const createValue = (alarmType: AlarmQuality): DType => {
  return newDType({ stringValue: "3.141" }, newDAlarm(alarmType, ""));
};

const UNUSED_VALUE = createValue(AlarmQuality.ALARM);
const BASE_PV = {
  effectivePvName: "TEST:PV",
  connected: true,
  readonly: true,
  value: UNUSED_VALUE
} as Partial<PvDatum> as PvDatum;

const DEFAULT_PROPS = {
  pvData: [BASE_PV],
  offColor: Color.RED,
  onColor: Color.GREEN
};

const renderLed = (ledProps: LedComponentProps): ReactTestRendererJSON => {
  return renderer
    .create(<LedComponent {...ledProps} />)
    .toJSON() as ReactTestRendererJSON;
};

describe("led changes Css properties based on alarm", (): void => {
  it.each([
    [AlarmQuality.ALARM, "alarm"],
    [AlarmQuality.CHANGING, "changing"],
    [AlarmQuality.INVALID, "invalid"],
    [AlarmQuality.UNDEFINED, "undefined"],
    [AlarmQuality.VALID, "valid"],
    [AlarmQuality.WARNING, "warning"]
  ])("alarms map to className", (alarm, extraClass) => {
    const value = createValue(alarm as AlarmQuality);

    const ledProps = {
      ...DEFAULT_PROPS,
      pvData: [{ ...BASE_PV, value }],
      alarmSensitive: true
    };

    const renderedLed = renderLed(ledProps);

    expect(renderedLed.props.className).toContain(extraClass);
  });
});

describe("background color changes depending on value", (): void => {
  it("off color is applied if value zero", (): void => {
    const ledProps = {
      ...DEFAULT_PROPS,
      pvData: [{ ...BASE_PV, value: ddouble(0) }]
    };

    const renderedLed = renderLed(ledProps);

    expect(renderedLed.props.style.backgroundColor).toBe(Color.RED.toString());
  });

  it("on color is applied if value not zero", (): void => {
    const ledProps = {
      ...DEFAULT_PROPS,
      pvData: [{ ...BASE_PV, value: ddouble(1) }]
    };

    const renderedLed = renderLed(ledProps);

    expect(renderedLed.props.style.backgroundColor).toBe(
      Color.GREEN.toString()
    );
  });
});

describe("width property is used", (): void => {
  it("width changes the size of the LED", (): void => {
    const renderedLed = renderLed({ ...DEFAULT_PROPS, width: 10 });

    // Width in CS-Studio doesn't quite match width in the browser,
    // so whatever is input has 5 subtracted from it, this makes it
    // look more like CS-Studio
    expect(renderedLed.props.style.width).toBe("10px");
    expect(renderedLed.props.style.height).toBe("20px");
  });
});

describe("height property is used", (): void => {
  it("height changes the size of the LED", (): void => {
    const renderedLed = renderLed({
      ...DEFAULT_PROPS,
      height: 10,
      square: true
    });

    // Width in CS-Studio doesn't quite match width in the browser,
    // so whatever is input has 5 subtracted from it, this makes it
    // look more like CS-Studio
    expect(renderedLed.props.style.width).toBe("20px");
    expect(renderedLed.props.style.height).toBe("10px");
    expect(renderedLed.props.style.borderRadius).toBe("0%");
  });
});
