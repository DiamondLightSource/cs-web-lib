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
  PvPropOpt
} from "../propTypes";

const ShapeProps = {
  pvName: PvPropOpt,
  shapeWidth: StringPropOpt,
  shapeHeight: StringPropOpt,
  shapeTransform: StringPropOpt,
  cornerWidth: StringPropOpt,
  cornerHeight: StringPropOpt,
  transparent: BoolPropOpt,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt
};

export const ShapeComponent = (
  props: InferWidgetProps<typeof ShapeProps>
): JSX.Element => {
  // Calculate radii of corners
  let cornerRadius = "0";
  if (props.cornerHeight && props.cornerWidth){
    cornerRadius = `${props.cornerWidth}px / ${props.cornerHeight}px`
  }
  const style = {
    ...commonCss(props),
    width: props.shapeWidth ?? "100%",
    height: props.shapeHeight ?? "100%",
    borderRadius: cornerRadius,
    transform: props.shapeTransform ?? ""
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
