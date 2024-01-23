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
    width: "100%",
    height: "100%",
    borderStyle: "solid",
    borderWidth: 3,
    borderColor:
      props.lineColor?.toString() || Color.fromRgba(0, 0, 255).toString()
  };
  // This has to be done separately because otherwise if width = 0, default
  // border width of 3 is set
  if (props.lineWidth !== undefined) style.borderWidth = props.lineWidth;
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
  if (fillOpts.transparent) {
    style.background = "transparent";
  } else if (fillOpts.gradient) {
    let fillDirection = "left";
    let firstGradientColor: string | undefined =
      fillOpts.bgGradientColor?.toString();
    let secondGradientColor: string | undefined = fillOpts.bgColor.toString();
    if (fillOpts.horizontalFill) {
      fillDirection = "bottom";
      firstGradientColor = fillOpts.bgColor.toString();
      secondGradientColor = fillOpts.bgGradientColor?.toString();
    }
    style.background = `-webkit-linear-gradient(${fillDirection}, ${firstGradientColor} ${fillOpts.level}%, ${secondGradientColor})`;
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
