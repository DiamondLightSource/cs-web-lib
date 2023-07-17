import React, { CSSProperties } from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  InferWidgetProps,
  BorderPropOpt,
  ColorPropOpt,
  IntPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import classes from "./ellipse.module.css";

export type FillOptions = {
  transparent: boolean;
  horizontalFill: boolean;
  gradient: boolean;
  bgGradientColor: Color | undefined;
  fgGradientColor: Color | undefined;
  bgColor: Color;
  level: number | string;
};

export const EllipseProps = {
  height: IntPropOpt,
  width: IntPropOpt,
  gradient: BoolPropOpt,
  bgGradientColor: ColorPropOpt,
  fgGradientColor: ColorPropOpt,
  lineWidth: IntPropOpt,
  lineColor: ColorPropOpt,
  transparent: BoolPropOpt,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  horizontalFill: BoolPropOpt,
  fillLevel: IntPropOpt
};

export const EllipseComponent = (
  props: InferWidgetProps<typeof EllipseProps>
): JSX.Element => {
  // Set up CSS style
  let style: CSSProperties = {
    width: props.width ? props.width - 5 : "100%",
    height: props.height ? props.height - 5 : "100%",
    borderStyle: "solid",
    borderWidth: props.lineWidth || 3,
    borderColor:
      props.lineColor?.toString() || Color.fromRgba(0, 0, 255).toString()
  };
  // Set filling options
  const fillOptions: FillOptions = {
    transparent: props.transparent ?? false,
    horizontalFill: props.horizontalFill ?? false,
    gradient: props.gradient ?? false,
    bgGradientColor: props.bgGradientColor,
    fgGradientColor: props.fgGradientColor,
    bgColor: props.backgroundColor ?? Color.fromRgba(0, 255, 255),
    level: props.fillLevel ?? 0
  };
  style = setFillOptions(style, fillOptions);
  return <div className={classes.Ellipse} style={style} />;
};

export function setFillOptions(
  style: CSSProperties,
  fillOpts: FillOptions
): CSSProperties {
  // Set filling options
  let fillDirection = "bottom";
  if (fillOpts.horizontalFill) fillDirection = "left";
  if (fillOpts.transparent) {
    style.background = "transparent";
  } else if (fillOpts.gradient) {
    // to do - figure out default colours for fill
    style.background = `-webkit-linear-gradient(${fillDirection}, ${fillOpts.bgGradientColor?.toString()} ${
      fillOpts.level
    }%, ${fillOpts.fgGradientColor?.toString()})`;
  } else {
    style.background = fillOpts.bgColor.toString();
  }
  return style;
}

const EllipseWidgetProps = {
  ...EllipseProps,
  ...WidgetPropType
};

export const Ellipse = (
  props: InferWidgetProps<typeof EllipseWidgetProps>
): JSX.Element => <Widget baseWidget={EllipseComponent} {...props} />;

registerWidget(Ellipse, EllipseWidgetProps, "ellipse");
