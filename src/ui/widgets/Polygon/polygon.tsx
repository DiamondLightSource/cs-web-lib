import React from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  BorderPropOpt,
  ColorPropOpt,
  IntPropOpt,
  BoolPropOpt,
  PointsPropOpt,
  MacrosPropOpt,
  StringPropOpt
} from "../propTypes";
import { Point } from "../../../types/points";
import { useStyle } from "../../hooks/useStyle";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

const widgetName = "polygon";

const PolygonProps = {
  macros: MacrosPropOpt,
  border: BorderPropOpt,
  lineWidth: IntPropOpt,
  lineColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  points: PointsPropOpt,
  rotationAngle: IntPropOpt,
  transparent: BoolPropOpt,
  width: StringPropOpt,
  height: StringPropOpt,
  visible: BoolPropOpt
};

type PolygonComponentProps = InferWidgetProps<typeof PolygonProps> & {
  class?: string;
};

export const PolygonComponent = (props: PolygonComponentProps): JSX.Element => {
  const [{ colors, customColors }, newProps] = useStyle(
    { ...props, customColors: { lineColor: props?.lineColor } },
    widgetName,
    props.class
  );
  const {
    lineWidth = 3,
    points,
    rotationAngle = 0,
    width = WIDGET_DEFAULT_SIZES["polygon"][0],
    height = WIDGET_DEFAULT_SIZES["polygon"][1],
    visible = true
  } = newProps as PolygonComponentProps;
  //Loop over points and convert to string for svg
  let coordinates = "";
  if (points) {
    points.values.forEach((point: Point) => {
      coordinates += `${point.x},${point.y} `;
    });
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      overflow={"visible"}
      visibility={visible ? "visible" : "hidden"}
    >
      <polygon
        overflow={"visible"}
        stroke={customColors?.lineColor}
        strokeWidth={lineWidth}
        fill={colors?.backgroundColor}
        transform={`rotate(${rotationAngle},0,0)`}
        points={coordinates}
      />
    </svg>
  );
};

const PolygonWidgetProps = {
  ...PolygonProps,
  ...WidgetPropType
};

export const Polygon = (
  props: InferWidgetProps<typeof PolygonWidgetProps>
): JSX.Element => <Widget baseWidget={PolygonComponent} {...props} />;

registerWidget(Polygon, PolygonWidgetProps, widgetName);
