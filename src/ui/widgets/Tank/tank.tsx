import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  IntPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt,
  BorderPropOpt
} from "../propTypes";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { Color } from "../../../types";

export const TankProps = {
  min: FloatPropOpt,
  max: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  logScale: BoolPropOpt,
  showLabel: BoolPropOpt,
  fillColor: ColorPropOpt,
  emptyColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt
};

export const TankComponent = (
  props: InferWidgetProps<typeof TankProps> & PVComponent
): JSX.Element => {
  const {
    value,
    limitsFromPv = false,
    showLabel = false,
    font,
    fillColor = "#3CFF3C",
    backgroundColor = Color.WHITE,
    emptyColor = Color.fromRgba(192, 192, 192),
    logScale = false,
    width = WIDGET_DEFAULT_SIZES["progressbar"][0],
    height = WIDGET_DEFAULT_SIZES["progressbar"][1]
  } = props;

  return (
    <span
      style={{
        borderRadius: "4px",
        backgroundColor: backgroundColor.toString(),
        height: "100%",
        width: "100%",
        overflow: "hidden",
        display: "block"
      }}
    >
      <span
        style={{
          display: "block",
          backgroundColor: emptyColor.toString()
        }}
      >
        <span
          style={{
            display: "block",
            backgroundColor: fillColor.toString(),
            top: "50%"
          }}
        ></span>
      </span>
    </span>
  );
};

const TankWidgetProps = {
  ...TankProps,
  ...PVWidgetPropType
};

export const Tank = (
  props: InferWidgetProps<typeof TankWidgetProps>
): JSX.Element => <Widget baseWidget={TankComponent} {...props} />;

registerWidget(Tank, TankWidgetProps, "tank");
