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
  StringOrNumPropOpt
} from "../propTypes";
import { Border, Color } from "../../../types";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

const ShapeProps = {
  pvName: PvPropOpt,
  width: StringOrNumPropOpt,
  height: StringOrNumPropOpt,
  shapeTransform: StringPropOpt,
  cornerWidth: StringPropOpt,
  cornerHeight: StringPropOpt,
  transparent: BoolPropOpt,
  backgroundColor: ColorPropOpt,
  lineColor: ColorPropOpt,
  lineWidth: IntPropOpt,
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
  const borderCss = new Border(1, lineColor, lineWidth).css();
  borderCss.borderRadius = cornerRadius;
  // Use line properties to set border, unless alarm border
  const style: CSSProperties = {
    ...borderCss,
    width: width,
    height: height,
    backgroundColor: props.transparent
      ? "transparent"
      : backgroundColor.toString(),
    transform: props.shapeTransform ?? "",
    visibility: visible ? undefined : "hidden"
  };
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
