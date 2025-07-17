import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Widget } from "../widget";
import { PVWidgetPropType, PVComponent } from "../widgetProps";
import {
  InferWidgetProps,
  FloatPropOpt,
  ColorPropOpt,
  BoolPropOpt,
  PointsProp,
  MacrosPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Color } from "../../../types/color";
import { Point } from "../../../types/points";

const LineProps = {
  points: PointsProp,
  macros: MacrosPropOpt,
  lineWidth: FloatPropOpt,
  lineColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  visible: BoolPropOpt,
  transparent: BoolPropOpt,
  rotationAngle: FloatPropOpt,
  arrows: FloatPropOpt,
  arrowLength: FloatPropOpt,
  fillArrow: BoolPropOpt
};

export type LineComponentProps = InferWidgetProps<typeof LineProps> &
  PVComponent;

export const LineComponent = (props: LineComponentProps): JSX.Element => {
  const {
    visible = true,
    transparent = false,
    backgroundColor = Color.fromRgba(0, 0, 255),
    rotationAngle = 0,
    lineWidth = 3,
    points,
    arrowLength = 20,
    arrows = 0,
    fillArrow = true,
    lineColor
  } = props;

  let color = (function () {
    if (lineColor) return lineColor.toString();
    else if (backgroundColor) return backgroundColor.toString();
    else return Color.fromRgba(0, 0, 255).toString();
  })();

  if (transparent) color = "transparent";
  // const color = transparent ? "transparent" : backgroundColor.toString();
  const transform = `rotation(${rotationAngle},0,0)`;

  // Each marker definition needs a unique ID or colours overlap
  const uid = uuidv4();

  // Create a marker if arrows set
  let arrowConfig = {};
  let markerConfig = <></>;
  const linePoints = points ? points.values : [];

  if (arrows) {
    switch (arrows) {
      // Arrow from
      case 1:
        arrowConfig = { markerStart: `url(#arrow${uid})` };
        // If filled, shorten line length to prevent overlap
        if (fillArrow) {
          linePoints[0] = recalculateLineLength(
            linePoints[1],
            linePoints[0],
            arrowLength
          );
        }
        break;

      // Arrow to
      case 2:
        arrowConfig = { markerEnd: `url(#arrow${uid})` };
        // If filled, shorten line length to prevent overlap
        if (fillArrow) {
          linePoints[linePoints.length - 1] = recalculateLineLength(
            linePoints[linePoints.length - 2],
            linePoints[linePoints.length - 1],
            arrowLength
          );
        }
        break;

      // Arrow both
      case 3:
        arrowConfig = {
          markerStart: `url(#arrow${uid})`,
          markerEnd: `url(#arrow${uid})`
        };
        if (fillArrow) {
          linePoints[linePoints.length - 1] = recalculateLineLength(
            linePoints[linePoints.length - 2],
            linePoints[linePoints.length - 1],
            arrowLength
          );
          linePoints[0] = recalculateLineLength(
            linePoints[1],
            linePoints[0],
            arrowLength
          );
        }
        break;
    }
    markerConfig = (
      <defs>
        <marker
          id={`arrow${uid}`}
          refX={fillArrow ? 0 : arrowLength}
          refY={`${arrowLength / 4}`}
          markerWidth={arrowLength}
          markerHeight={arrowLength / 2}
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
          overflow="visible"
        >
          <path
            d={`M 0 0 L ${arrowLength} ${arrowLength / 4} L 0 ${arrowLength / 2}`}
            stroke={fillArrow ? "none" : color}
            fill={fillArrow ? color : "none"}
            overflow="visible"
            strokeWidth={lineWidth}
          />
        </marker>
      </defs>
    );
  }

  let coordinates = "";
  if (points !== undefined && visible) {
    linePoints.forEach((point: Point) => {
      coordinates += `${point.x},${point.y} `;
    });
    return (
      <svg
        display={"block"}
        viewBox={`0 0 100% 100%`}
        xmlns="http://www.w3.org/2000/svg"
        overflow={"visible"}
      >
        {markerConfig}
        <polyline
          overflow={"visible"}
          stroke={color}
          strokeWidth={lineWidth}
          fill={"none"}
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

/**
 * Recalculate the length of the line when a filled arrow
 * is present. This prevents the line from obscuring the
 * arrow. SVG does not include any easy way to layer an arrow
 * on top of a line without having the line show if it is thicker
 * than the arrow width, so we shorten the line to prevent this.
 * Calculate hypoteneuse of line and shorten by arrow length, then map
 * this change to the x, y coordinates
 * @param startPoint the first set of x,y coordinates of line segment
 * @param endPoint the second set of x, y coordinates of line segment
 */
function recalculateLineLength(
  startPoint: Point,
  endPoint: Point,
  arrowLen: number
): Point {
  // Determine x and y distance between coordinate sets
  let xLen = endPoint.x - startPoint.x;
  let yLen = endPoint.y - startPoint.y;
  // Calculate hypoteneuse length
  const lineLen = Math.hypot(xLen, yLen);
  // Calculate new length by subtracting arrowlength
  const newLineLen = lineLen - arrowLen;
  // If arrowLen longer than lineLen, make line short as possible
  // Ideally shouldn't be used this way as arrow should be shorter
  // Determine what fraction smaller new length is
  const frac = (arrowLen >= lineLen ? 2 : newLineLen) / lineLen;
  // Multiply lengths by fraction to get new lengths
  xLen *= frac;
  yLen *= frac;
  // Calculate new final x y coordinates
  endPoint.x = startPoint.x + Math.round(xLen);
  endPoint.y = startPoint.y + Math.round(yLen);
  // Return newly calculated final coordinates
  return endPoint;
}

const LineWidgetProps = {
  ...LineProps,
  ...PVWidgetPropType
};

export const Line = (
  props: InferWidgetProps<typeof LineWidgetProps>
): JSX.Element => <Widget baseWidget={LineComponent} {...props} />;

registerWidget(Line, LineWidgetProps, "line");
