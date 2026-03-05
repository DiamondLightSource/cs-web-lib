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
  MacrosPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import { useStyle } from "../../hooks/useStyle";
import { BorderStyle } from "../../../types/border";

const widgetName = "shape";

const ShapeProps = {
  pvName: PvPropOpt,
  macros: MacrosPropOpt,
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
  const { visible = true } = props;

  const themeStyle = useStyle(
    {
      ...props,
      border: {
        color: props.lineColor as Color,
        width: props.lineWidth as number,
        radius: 1,
        style: BorderStyle.Line
      },
      visible: visible
    },
    widgetName
  );

  // Style overrides - Calculate radii of corners
  const cornerRadius = `${props.cornerWidth || 0}px / ${
    props.cornerHeight || 0
  }px`;

  const borderStyle = (function () {
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

  // Use line properties to set border, unless alarm border
  const style: CSSProperties = {
    ...themeStyle.border,
    ...themeStyle.colors,
    borderStyle,
    borderRadius: cornerRadius,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    transform: props.shapeTransform ?? "",
    visibility: themeStyle?.other?.visibility
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

registerWidget(Shape, ShapeWidgetProps, widgetName);
