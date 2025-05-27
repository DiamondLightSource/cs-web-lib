import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  ColorPropOpt
} from "../propTypes";
import classes from "./thermometer.module.css";
import { Color } from "../../../types";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { AlarmQuality } from "../../../types/dtypes";

export const ThermometerProps = {
  min: FloatPropOpt,
  max: FloatPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  fillColor: ColorPropOpt,
  alarmSensitive: BoolPropOpt
};

export const ThermometerComponent = (
  props: InferWidgetProps<typeof ThermometerProps> & PVComponent
): JSX.Element => {
  const {
    height = WIDGET_DEFAULT_SIZES["thermometer"][1],
    width = WIDGET_DEFAULT_SIZES["thermometer"][0],
    value,
    limitsFromPv = true,
    fillColor = Color.fromRgba(60, 255, 60),
    alarmSensitive = true
  } = props;

  let { min = 0, max = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }
  const numValue = value?.getDoubleValue() ?? 0;
  const percent = ((numValue - min) * 100) / (max - min);

  let outline = "0px solid #000000";

  const alarmQuality = props.value?.getAlarm().quality ?? AlarmQuality.VALID;
  if (alarmSensitive) {
    switch (alarmQuality) {
      case AlarmQuality.UNDEFINED:
      case AlarmQuality.INVALID:
      case AlarmQuality.CHANGING:
        outline = "1px solid var(--invalid)";
        break;
      case AlarmQuality.ALARM:
      case AlarmQuality.WARNING:
        outline = "2px solid var(--alarm)";
    }
  }

  const bulbWidth = width < height * 0.1 ? width : height * 0.1;

  return (
    <span
      className={classes.ThermometerBackground}
      style={{
        outline: outline
      }}
    >
      <span
        className={classes.Stem}
        style={{
          height: height - bulbWidth,
          background: `linear-gradient(#FF0000, ${fillColor.toString()})`,
          width: bulbWidth / 2,
          transform: `translateX(-${bulbWidth / 4}px)`
        }}
      >
        <span
          className={classes.Mercury}
          style={{
            backgroundColor: Color.fromRgba(192, 192, 192).toString(),
            transform: `translateY(${-percent}%)`
          }}
        />
      </span>
      <span
        className={classes.Joint}
        style={{
          width: bulbWidth / 2,
          height: bulbWidth / 2,
          bottom: bulbWidth / 2,
          backgroundColor: fillColor.toString(),
          transform: `translateX(-${bulbWidth / 4}px)`
        }}
      />
      <span
        className={classes.Bulb}
        style={{
          height: bulbWidth,
          width: bulbWidth,
          backgroundColor: fillColor.toString(),
          transform: `translateX(-${bulbWidth / 2}px)`
        }}
      />
    </span>
  );
};

const ThermometerWidgetProps = {
  ...ThermometerProps,
  ...PVWidgetPropType
};

export const Thermometer = (
  props: InferWidgetProps<typeof ThermometerWidgetProps>
): JSX.Element => <Widget baseWidget={ThermometerComponent} {...props} />;

registerWidget(Thermometer, ThermometerWidgetProps, "thermometer");
