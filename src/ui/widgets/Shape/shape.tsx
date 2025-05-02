import React, { CSSProperties } from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  StringPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  PvPropOpt,
  IntPropOpt,
  StringOrNumPropOpt,
  MacrosPropOpt
} from "../propTypes";
import { Color } from "../../../types";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

const ShapeProps = {
  pvName: PvPropOpt,
  macros: MacrosPropOpt,
  width: StringOrNumPropOpt,
  height: StringOrNumPropOpt,
  shapeTransform: StringPropOpt,
  cornerWidth: StringPropOpt,
  cornerHeight: StringPropOpt,
  transparent: BoolPropOpt,
  backgroundColor: ColorPropOpt,
  lineColor: ColorPropOpt,
  lineWidth: IntPropOpt,
  lineStyle: IntPropOpt,
  visible: BoolPropOpt
};

export const ShapeComponent = (
  props: InferWidgetProps<typeof ShapeProps>
): JSX.Element => {
  const {
    width = WIDGET_DEFAULT_SIZES["rectangle"][0],
    height = WIDGET_DEFAULT_SIZES["rectangle"][1],
    lineColor = Color.fromRgba(0, 0, 255),
    lineWidth = 3,
    backgroundColor = Color.fromRgba(30, 144, 255),
    visible = true
  } = props;
  // Calculate radii of corners
  const cornerRadius = `${props.cornerWidth || 0}px / ${
    props.cornerHeight || 0
  }px`;

  // Use line properties to set border, unless alarm border
  const style: CSSProperties = {
    borderColor: lineColor.toString(),
    borderWidth: lineWidth,
    borderRadius: cornerRadius,
    width: width,
    height: height,
    boxSizing: "border-box",
    backgroundColor: props.transparent
      ? "transparent"
      : backgroundColor.toString(),
    transform: props.shapeTransform ?? "",
    visibility: visible ? undefined : "hidden"
  };

  style.borderStyle = (function () {
    switch (props.lineStyle) {
      case 1: // Dashed
      case 3: // Dash-Dot
        return "dashed";
      case 2: // Dot
      case 4: // Dash-Dot-Dot
        return "dotted";
      default:
        return "solid";
    }
  })();

  return <div style={style} />;
};

const ShapeWidgetProps = {
  ...ShapeProps,
  ...WidgetPropType
};

export const Shape = (
  props: InferWidgetProps<typeof ShapeWidgetProps>
): JSX.Element => <Widget baseWidget={ShapeComponent} {...props} />;

registerWidget(Shape, ShapeWidgetProps, "shape");
