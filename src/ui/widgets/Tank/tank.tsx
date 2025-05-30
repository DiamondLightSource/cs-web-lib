import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt,
  BorderPropOpt
} from "../propTypes";
import { Color } from "../../../types";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { AlarmQuality } from "../../../types/dtypes";
import { TankWithScale } from "./tankWithScale";
import { TankWithoutScale } from "./tankWithoutScale";

export const TankProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  logScale: BoolPropOpt,
  fillColor: ColorPropOpt,
  emptyColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt,
  scaleVisible: BoolPropOpt,
  alarmSensitive: BoolPropOpt
};

export const TankComponent = (
  props: InferWidgetProps<typeof TankProps> & PVComponent
): JSX.Element => {
  const {
    value,
    limitsFromPv = false,
    font,
    fillColor = Color.BLUE,
    emptyColor = Color.fromRgba(192, 192, 192),
    foregroundColor = Color.BLACK,
    backgroundColor = Color.WHITE,
    logScale = false,
    scaleVisible = true,
    alarmSensitive = true,
    width = WIDGET_DEFAULT_SIZES["tank"][0]
  } = props;

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    minimum = value.display.controlRange?.min;
    maximum = value.display.controlRange?.max;
  }
  const numValue = value?.getDoubleValue() ?? 0;
  const percentCalc = logScale
    ? minimum === 0
      ? (Math.log10(numValue) * 100) / Math.log10(maximum)
      : ((Math.log10(numValue) - Math.log10(minimum)) * 100) /
        (Math.log10(maximum) - Math.log10(minimum))
    : ((numValue - minimum) * 100) / (maximum - minimum);

  const percent =
    numValue < minimum ? 0 : numValue > maximum ? 100 : percentCalc;

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

  if (scaleVisible) {
    return (
      <TankWithScale
        min={minimum}
        max={maximum}
        emptyColor={emptyColor}
        fillColor={fillColor}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        font={font}
        percent={percent}
        width={width}
        outline={outline}
        logScale={logScale}
      ></TankWithScale>
    );
  } else {
    return (
      <TankWithoutScale
        emptyColor={emptyColor}
        fillColor={fillColor}
        backgroundColor={backgroundColor}
        percent={percent}
        outline={outline}
      ></TankWithoutScale>
    );
  }
};

const TankWidgetProps = {
  ...TankProps,
  ...PVWidgetPropType
};

export const Tank = (
  props: InferWidgetProps<typeof TankWidgetProps>
): JSX.Element => <Widget baseWidget={TankComponent} {...props} />;

registerWidget(Tank, TankWidgetProps, "tank");
