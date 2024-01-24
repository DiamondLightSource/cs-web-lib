import React from "react";
import { Widget } from "../widget";
import { PVWidgetPropType, PVComponent } from "../widgetProps";
import {
  InferWidgetProps,
  FloatPropOpt,
  ColorPropOpt,
  BoolPropOpt,
  FloatProp,
  PointsPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Color } from "../../../types/color";
import { Point } from "../../../types/points";

const LineProps = {
  width: FloatProp,
  height: FloatProp,
  lineWidth: FloatPropOpt,
  backgroundColor: ColorPropOpt,
  visible: BoolPropOpt,
  transparent: BoolPropOpt,
  rotationAngle: FloatPropOpt,
  points: PointsPropOpt
};

export type LineComponentProps = InferWidgetProps<typeof LineProps> &
  PVComponent;

export const LineComponent = (props: LineComponentProps): JSX.Element => {
  const {
    visible = true,
    transparent = false,
    backgroundColor,
    rotationAngle = 0,
    width,
    height,
    lineWidth = 1,
    points
  } = props;

  const transform = `rotation(${rotationAngle},0,0)`;

  let coordinates = "";
  if (points !== undefined && visible) {
    points.values.forEach((point: Point) => {
      coordinates += `${point.x},${point.y} `;
    });
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <polyline
          overflow={"visible"}
          stroke={
            transparent
              ? Color.TRANSPARENT.toString()
              : backgroundColor?.toString()
          }
          fill={"none"}
          strokeWidth={lineWidth}
          transform={transform}
          points={coordinates}
        />
      </svg>
    );
  } else {
    return <></>;
  }
};

const LineWidgetProps = {
  ...LineProps,
  ...PVWidgetPropType
};

export const Line = (
  props: InferWidgetProps<typeof LineWidgetProps>
): JSX.Element => <Widget baseWidget={LineComponent} {...props} />;

registerWidget(Line, LineWidgetProps, "line");
