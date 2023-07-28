import React from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt
} from "../propTypes";
import classes from "./arc.module.css";

const ArcProps = {
  width: IntPropOpt,
  height: IntPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  fill: BoolPropOpt,
  startAngle: IntPropOpt,
  totalAngle: IntPropOpt,
  lineWidth: IntPropOpt
};

export const ArcComponent = (
  props: InferWidgetProps<typeof ArcProps>
): JSX.Element => {
  const {
    width,
    height,
    backgroundColor,
    foregroundColor,
    fill = false,
    startAngle = 0,
    totalAngle = 90,
    lineWidth = 1
  } = props;
  const fillColor = fill ? backgroundColor?.toString() : "transparent";
  if (width !== undefined && height !== undefined) {
    const radiusX = Math.floor(width / 2);
    const radiusY = Math.floor(height / 2);
    const elements: Array<JSX.Element> = [];
    const segments: number[] = [];
    // We create the arc as segments of 90 degrees or less
    const factor = Math.floor(totalAngle / 90);
    for (let i = 1; i <= factor; i++) {
      segments.push(90);
    }
    // If remainder isn't zero, add non-90 segment
    const residualAngle = totalAngle - factor * 90;
    if (residualAngle > 0) segments.push(residualAngle);
    // Set start angle
    let theta = (startAngle * Math.PI) / 180;
    segments.forEach((angle: number, idx: number) => {
      const ratio = angle / 360;
      // Get the angle of the segment (delta)
      const delta = ratio * 2 * Math.PI;
      // These are the points on the circumfrence that the arc starts and ends
      const startPos = circumPointFromAngle(
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        theta
      );
      const endPos = circumPointFromAngle(
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        theta + delta
      );

      // Add previous segment angle to stack segments
      theta += delta;

      // Set up SVG path commands - filled shape and border
      // Don't add fill element if set to not fill
      if (fill) {
        const arc = [
          `M ${radiusX} ${radiusY}`, // Set point
          `L ${startPos.join(" ")}`, // Line
          `A ${radiusX} ${radiusY} ${startAngle} 0 1 ${endPos.join(" ")}`, // Make line elliptical
          "Z" // Close path
        ];

        elements.push(
          <path
            className={classes.ArcPath}
            d={arc.join("\n")}
            fill={fillColor}
            key={`arc${idx}`}
          ></path>
        );
      }

      const border = [
        `M ${startPos.join(" ")}`, // Set start point on arc
        `A ${radiusX} ${radiusY} ${startAngle} 0 1 ${endPos.join(" ")}` // Draw elliptical line
      ];
      elements.push(
        <path
          className={classes.BorderPath}
          d={border.join("\n")}
          stroke={foregroundColor?.toString()}
          fill="transparent"
          key={`border${idx}`}
          strokeWidth={lineWidth}
        ></path>
      );
    });
    return (
      <svg className={classes.Arc} viewBox={`0 0 ${width} ${height}`}>
        {elements}
      </svg>
    );
  }
  return <></>;
};

// Calculate coordinates of point on circle from angle, radius
// and centre coordinates
export function circumPointFromAngle(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a: number
): [number, number] {
  return [Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a))];
}

const ArcWidgetProps = {
  ...ArcProps,
  ...WidgetPropType
};

export const Arc = (
  props: InferWidgetProps<typeof ArcWidgetProps>
): JSX.Element => <Widget baseWidget={ArcComponent} {...props} />;

registerWidget(Arc, ArcWidgetProps, "arc");
