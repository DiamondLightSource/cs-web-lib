import React, { CSSProperties } from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  BoolPropOpt,
  FloatPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import classes from "./led.module.css";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { getPvValueAndName } from "../utils";
import {
  dTypeGetAlarm,
  dTypeGetDoubleValue,
  DAlarmNONE
} from "../../../types/dtypes";
import { ColorUtils } from "../../../types/color";

/**
 * width: the diameter of the LED
 */
export const LedProps = {
  width: FloatPropOpt,
  height: FloatPropOpt,
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  lineColor: ColorPropOpt,
  alarmSensitive: BoolPropOpt,
  bit: IntPropOpt,
  square: BoolPropOpt
};

export type LedComponentProps = InferWidgetProps<typeof LedProps> & PVComponent;

/**
 * @param props properties to pass in, these will be handled by the below LED
 * function and only extra props defined on LedProps need to be passed in as well,
 * to define some text explaining the meaning of the LED in different colours add a
 * tooltip property in a json file containing a led
 */
export const LedComponent = (props: LedComponentProps): JSX.Element => {
  const {
    pvData,
    onColor = ColorUtils.fromRgba(0, 255, 0),
    offColor = ColorUtils.fromRgba(60, 100, 60),
    lineColor = ColorUtils.fromRgba(50, 50, 50, 178),
    width = WIDGET_DEFAULT_SIZES["led"][0],
    height = WIDGET_DEFAULT_SIZES["led"][1],
    alarmSensitive = false,
    bit = -1,
    square = false
  } = props;

  const { value } = getPvValueAndName(pvData);

  const style: CSSProperties = {};

  let ledOn = false;
  const doubleValue = dTypeGetDoubleValue(value);
  if (doubleValue !== undefined) {
    if (bit < 0) {
      // Off if vlaue is 0, on otherwise.
      ledOn = doubleValue !== 0;
    } else {
      // Off if value-th bit is 0, on if it is 1
      ledOn = ((1 << doubleValue) & bit) === bit;
    }
  }
  style["backgroundColor"] = ledOn
    ? onColor?.colorString
    : offColor?.colorString;
  style["border"] = `2px solid ${lineColor.colorString}`;
  style["borderRadius"] = square ? "0%" : "50%";

  // make sizes similar to size in CS-Studio, five taken
  // away from default in css file too
  style.width = `${width}px`;
  style.height = `${height}px`;

  let className = classes.Led;
  if (alarmSensitive) {
    const alarm = dTypeGetAlarm(value) || DAlarmNONE();
    className += ` ${classes[alarm.quality]}`;
  }

  return <div className={className} style={style} />;
};

const LedWidgetProps = {
  ...LedProps,
  ...PVWidgetPropType
};

export const LED = (
  props: InferWidgetProps<typeof LedWidgetProps>
): JSX.Element => <Widget baseWidget={LedComponent} {...props} />;

registerWidget(LED, LedWidgetProps, "led");
