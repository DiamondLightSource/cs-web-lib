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
import { Color, Font } from "../../../types";
import classes from "./tank.module.css";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { useTheme } from "@mui/material";

export const TankProps = {
  min: FloatPropOpt,
  max: FloatPropOpt,
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
  scaleVisible: BoolPropOpt
};

const TankWithScale = (props: {
  min: number;
  max: number;
  emptyColor: Color;
  fillColor: Color;
  foregroundColor: Color;
  backgroundColor: Color;
  font: Font | undefined;
  percent: number;
  width: number;
}): JSX.Element => {
  const {
    min,
    max,
    emptyColor,
    fillColor,
    foregroundColor,
    backgroundColor,
    font,
    percent,
    width
  } = props;
  return (
    <span
      className={classes.TankBackground}
      style={{
        backgroundColor: backgroundColor.toString()
      }}
    >
      <span
        className={classes.ScaleMarker}
        style={{
          width: "20%",
          top: "10%",
          color: foregroundColor.toString(),
          ...font?.css()
        }}
      >
        {max}
      </span>
      <span
        className={classes.ScaleMarker}
        style={{
          width: "20%",
          top: "90%",
          color: foregroundColor.toString(),
          ...font?.css()
        }}
      >
        {min}
      </span>
      <span
        className={classes.EmptyTank}
        style={{
          height: "80%",
          width: "80%",
          top: "10%",
          right: "0%",
          backgroundColor: emptyColor.toString()
        }}
      >
        <span
          className={classes.TankFill}
          style={{
            backgroundColor: fillColor.toString(),
            top: `${100 - percent}%`
          }}
        ></span>
      </span>
    </span>
  );
};

const TankWithoutScale = (props: {
  emptyColor: Color;
  fillColor: Color;
  backgroundColor: Color;
  percent: number;
}): JSX.Element => {
  const { emptyColor, fillColor, backgroundColor, percent } = props;
  return (
    <span
      className={classes.TankBackground}
      style={{
        backgroundColor: backgroundColor.toString()
      }}
    >
      <span
        className={classes.EmptyTank}
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: emptyColor.toString()
        }}
      >
        <span
          className={classes.TankFill}
          style={{
            backgroundColor: fillColor.toString(),
            top: `${100 - percent}%`
          }}
        ></span>
      </span>
    </span>
  );
};

export const TankComponent = (
  props: InferWidgetProps<typeof TankProps> & PVComponent
): JSX.Element => {
  const theme = useTheme();
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
    width = WIDGET_DEFAULT_SIZES["tank"][0]
  } = props;

  let { min = 0, max = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }
  const numValue = value?.getDoubleValue() ?? 0;
  const percentCalc = logScale
    ? ((Math.log10(numValue) - Math.log10(min)) * 100) /
      (Math.log10(max) - Math.log10(min))
    : ((numValue - min) * 100) / (max - min);

  const percent = numValue < min ? 0 : numValue > max ? 100 : percentCalc;

  if (scaleVisible) {
    return (
      <TankWithScale
        min={min}
        max={max}
        emptyColor={emptyColor}
        fillColor={fillColor}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        font={font}
        percent={percent}
        width={width}
      ></TankWithScale>
    );
  } else {
    return (
      <TankWithoutScale
        emptyColor={emptyColor}
        fillColor={fillColor}
        backgroundColor={backgroundColor}
        percent={percent}
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
