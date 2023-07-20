import React from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  BorderPropOpt,
  ColorPropOpt,
  IntPropOpt,
  PointsPropOpt
} from "../propTypes";
import { Point } from "../../../types/points";

const PolygonProps = {
  height: IntPropOpt,
  width: IntPropOpt,
  border: BorderPropOpt,
  lineWidth: IntPropOpt,
  lineColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  points: PointsPropOpt,
  rotationAngle: IntPropOpt
};

export const PolygonComponent = (
  props: InferWidgetProps<typeof PolygonProps>
): JSX.Element => {
  const {
    width,
    height,
    lineWidth,
    lineColor,
    backgroundColor,
    points,
    rotationAngle = 0
  } = props;
  //Loop over points and convert to string for svg
  let coordinates = "";
  if (points !== undefined) {
    points.values.forEach((point: Point) => {
      coordinates += `${point.x},${point.y} `;
    });
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon
          overflow={"visible"}
          stroke={lineColor?.toString()}
          strokeWidth={lineWidth}
          fill={backgroundColor ? backgroundColor.toString() : "none"} // background colour
          transform={`rotation(${rotationAngle},0,0)`}
          points={coordinates}
        />
      </svg>
    );
  }
  // If no points, plot nothing
  return <></>;
};

const PolygonWidgetProps = {
  ...PolygonProps,
  ...WidgetPropType
};

export const Polygon = (
  props: InferWidgetProps<typeof PolygonWidgetProps>
): JSX.Element => <Widget baseWidget={PolygonComponent} {...props} />;

registerWidget(Polygon, PolygonWidgetProps, "polygon");
