import React from "react";
import { Widget } from "../widget";
import { PVWidgetPropType, PVComponent } from "../widgetProps";
import {
  InferWidgetProps,
  FloatPropOpt,
  ColorPropOpt,
  BoolPropOpt,
  FloatProp,
  PointsProp
} from "../propTypes";
import { registerWidget } from "../register";
import { Color } from "../../../types/color";
import { Point } from "../../../types/points";

const LineProps = {
  width: FloatProp,
  height: FloatProp,
  points: PointsProp,
  lineWidth: FloatPropOpt,
  backgroundColor: ColorPropOpt,
  visible: BoolPropOpt,
  transparent: BoolPropOpt,
  rotationAngle: FloatPropOpt,
  arrows: FloatPropOpt,
  arrowLength: FloatPropOpt
};

export type LineComponentProps = InferWidgetProps<typeof LineProps> &
  PVComponent;

export const LineComponent = (props: LineComponentProps): JSX.Element => {
  const {
    visible = true,
    transparent = false,
    backgroundColor = Color.fromRgba(0, 0, 255),
    rotationAngle = 0,
    width,
    height,
    lineWidth = 1,
    points,
    arrowLength = 2,
    arrows = 0
  } = props;

  const transform = `rotation(${rotationAngle},0,0)`;

  // Each marker definition needs a unique ID or colours overlap
  // Get random decimal number, take decimal part and truncate
  const uid = String(Math.random()).split(".")[1].substring(0, 6);
  // Create a marker if arrows set
  let arrowSize = "";
  let arrowConfig = {};
  let markerConfig = <></>;
  if (arrows) {
    arrowSize = `M 0 0 L ${arrowLength} ${arrowLength / 4} L 0 ${
      arrowLength / 2
    } z`;
    switch (arrows) {
      case 1:
        arrowConfig = { markerStart: `url(#arrow${uid})` };
        break;
      case 2:
        arrowConfig = { markerEnd: `url(#arrow${uid})` };
        break;
      case 3:
        arrowConfig = {
          markerStart: `url(#arrow${uid})`,
          markerEnd: `url(#arrow${uid})`
        };
        break;
    }
    markerConfig = (
      <defs>
        <marker
          id={`arrow${uid}`}
          viewBox={`0 0 ${arrowLength} ${arrowLength}`}
          refX={`${arrowLength - 2}`}
          refY={`${arrowLength / 4}`}
          markerWidth={`${arrowLength}`}
          markerHeight={`${arrowLength}`}
          orient="auto-start-reverse"
        >
          <path
            d={arrowSize}
            stroke={backgroundColor?.toString()}
            fill={backgroundColor?.toString()}
          />
        </marker>
      </defs>
    );
  }
  // 0 is none, 1 is from (marker start), 2 is to (marker end), 3 is both

  let coordinates = "";
  if (points !== undefined && visible) {
    points.values.forEach((point: Point) => {
      coordinates += `${point.x},${point.y} `;
    });
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        overflow={"visible"}
      >
        {markerConfig}
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
          {...arrowConfig}
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
