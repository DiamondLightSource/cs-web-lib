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
  MacrosPropOpt
} from "../propTypes";
import { Point } from "../../../types/points";
import { ColorUtils } from "../../../types/color";

const PolygonProps = {
  macros: MacrosPropOpt,
  border: BorderPropOpt,
  lineWidth: IntPropOpt,
  lineColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  points: PointsPropOpt,
  rotationAngle: IntPropOpt,
  transparent: BoolPropOpt
};

export const PolygonComponent = (
  props: InferWidgetProps<typeof PolygonProps>
): JSX.Element => {
  const {
    lineWidth = 3,
    lineColor = ColorUtils.fromRgba(0, 0, 255),
    backgroundColor = ColorUtils.fromRgba(50, 50, 255),
    points,
    rotationAngle = 0,
    transparent = false
  } = props;
  //Loop over points and convert to string for svg
  let coordinates = "";
  if (points) {
    points.values.forEach((point: Point) => {
      coordinates += `${point.x},${point.y} `;
    });
  }

  return (
    <svg
      viewBox={`0 0 100% 100%`}
      xmlns="http://www.w3.org/2000/svg"
      overflow={"visible"}
    >
      <polygon
        overflow={"visible"}
        stroke={lineColor.colorString}
        strokeWidth={lineWidth}
        fill={transparent ? "transparent" : backgroundColor.colorString} // background colour
        transform={`rotation(${rotationAngle},0,0)`}
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

registerWidget(Polygon, PolygonWidgetProps, "polygon");
