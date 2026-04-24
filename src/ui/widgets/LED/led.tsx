import React, { CSSProperties } from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  BoolPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import classes from "./led.module.css";
import { getPvValueAndName } from "../utils";
import {
  dTypeGetAlarm,
  dTypeGetDoubleValue,
  DAlarmNONE
} from "../../../types/dtypes";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "led";

/**
 * width: the diameter of the LED
 */
export const LedProps = {
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
  const { pvData, alarmSensitive = false, bit = -1, square = false } = props;

  const style = useStyle(
    {
      ...props,
      customColors: {
        onColor: props?.onColor,
        offColor: props?.offColor,
        lineColor: props?.lineColor
      }
    },
    widgetName
  );

  const { value } = getPvValueAndName(pvData);

  const divStyle: CSSProperties = {};

  let ledOn = false;
  const doubleValue = dTypeGetDoubleValue(value);
  if (doubleValue !== undefined) {
    if (bit < 0) {
      // Off if value is 0, on otherwise.
      ledOn = doubleValue !== 0;
    } else {
      // Off if value-th bit is 0, on if it is 1
      ledOn = ((1 << doubleValue) & bit) === bit;
    }
  }

  divStyle["backgroundColor"] = ledOn
    ? style?.customColors?.onColor
    : style?.customColors?.offColor;
  divStyle["border"] = `2px solid ${style?.customColors?.lineColor}`;
  divStyle["borderRadius"] = square ? "0%" : "50%";
  divStyle.width = "100%";
  divStyle.height = "100%";

  let className = classes.Led;
  if (alarmSensitive) {
    const alarm = dTypeGetAlarm(value) || DAlarmNONE();
    className += ` ${classes[alarm.quality]}`;
  }

  return <div className={className} style={divStyle} />;
};

const LedWidgetProps = {
  ...LedProps,
  ...PVWidgetPropType
};

export const LED = (
  props: InferWidgetProps<typeof LedWidgetProps>
): JSX.Element => <Widget baseWidget={LedComponent} {...props} />;

registerWidget(LED, LedWidgetProps, widgetName);
