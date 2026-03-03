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
import { useStyle } from "../../hooks/useStyle";

const widgetName = "polygon";

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
  const { colors, customColors } = useStyle(
    { ...props, customColors: { lineColor: props?.lineColor } },
    widgetName
  );
  const { lineWidth = 3, points, rotationAngle = 0 } = props;
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
        stroke={customColors?.lineColor}
        strokeWidth={lineWidth}
        fill={colors?.backgroundColor}
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

registerWidget(Polygon, PolygonWidgetProps, widgetName);
