import React from "react";
import { commonCss, Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  StringPropOpt,
  InferWidgetProps,
  BorderPropOpt,
  ColorPropOpt,
  PvPropOpt,
  IntPropOpt
} from "../propTypes";
import { Color } from "../../../types";

const ShapeProps = {
  pvName: PvPropOpt,
  width: IntPropOpt,
  height: IntPropOpt,
  shapeTransform: StringPropOpt,
  cornerWidth: StringPropOpt,
  cornerHeight: StringPropOpt,
  transparent: BoolPropOpt,
  backgroundColor: ColorPropOpt,
  lineColor: ColorPropOpt,
  lineWidth: IntPropOpt,
  border: BorderPropOpt
};

export const ShapeComponent = (
  props: InferWidgetProps<typeof ShapeProps>
): JSX.Element => {
  const {
    width = 100,
    height = 20,
    backgroundColor = Color.fromRgba(30, 144, 255),
    lineColor = Color.fromRgba(0, 0, 255),
    lineWidth = 3,
    cornerHeight = 0,
    cornerWidth = 0
  } = props;
  // Calculate radii of corners
  let cornerRadius = `${cornerWidth}px / ${cornerHeight}px`;
  const style = {
    ...commonCss(props),
    width: width,
    height: height,
    borderRadius: cornerRadius,
    border: `${lineWidth}px solid ${lineColor.toString()}`,
    transform: props.shapeTransform ?? "",
    backgroundColor: props.transparent ? "transparent" : backgroundColor.toString()
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
