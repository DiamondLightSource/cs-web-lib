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
import { Color } from "../../../types";

const ArcProps = {
  width: IntPropOpt,
  height: IntPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  fill: BoolPropOpt,
  startAngle: IntPropOpt,
  totalAngle: IntPropOpt,
  lineWidth: IntPropOpt,
  lineColor: ColorPropOpt
};

export const ArcComponent = (
  props: InferWidgetProps<typeof ArcProps>
): JSX.Element => {
  const {
    width = 100,
    height = 100,
    backgroundColor = Color.fromRgba(30, 144, 255),
    fill = true,
    startAngle = 0,
    totalAngle = 90,
    lineWidth = 3,
    lineColor = Color.fromRgba(0, 0, 255)
  } = props;
  const fillColor = fill ? backgroundColor?.toString() : "transparent";
  const radiusX = Math.floor(width / 2);
  const radiusY = Math.floor(height / 2);
  const elements: Array<JSX.Element> = [];
  const segments: number[] = [];
  const negAngle = totalAngle < 0 ? true : false;
  // We create the arc as segments of 90 degrees or less
  const factor = negAngle
    ? Math.abs(Math.ceil(totalAngle / 90))
    : Math.floor(totalAngle / 90);
  for (let i = 1; i <= factor; i++) {
    segments.push(90);
  }
  // If remainder isn't zero, add non-90 segment
  const residualAngle = Math.abs(totalAngle) - factor * 90;
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
      negAngle ? theta - delta : theta + delta // Arc coordinates are different if -totalAngle
    );

    // Combine previous segment angle to stack segments
    negAngle ? (theta -= delta) : (theta += delta);

    // Set up SVG path commands - filled shape and border
    // Don't add fill element if set to not fill
    if (fill) {
      const arc = [
        `M ${radiusX} ${radiusY}`, // Set point
        `L ${startPos.join(" ")}`, // Line
        `A ${radiusX} ${radiusY} ${startAngle} 0 ${
          negAngle ? 0 : 1
        } ${endPos.join(" ")}`, // Make line elliptical
        "Z" // Close path
      ];

      elements.push(
        <path
          className={classes.ArcPath}
          d={arc.join("\n")}
          fill={fillColor}
          stroke={fillColor}
          key={`arc${idx}`}
          strokeWidth={lineWidth}
        ></path>
      );
    }

    const border = [
      `M ${startPos.join(" ")}`, // Set start point on arc
      `A ${radiusX} ${radiusY} ${startAngle} 0 ${
        negAngle ? 0 : 1
      } ${endPos.join(" ")}` // Draw elliptical line
    ];
    elements.push(
      <path
        className={classes.BorderPath}
        d={border.join("\n")}
        stroke={lineColor.toString()}
        fill="transparent"
        key={`border${idx}`}
        strokeWidth={lineWidth}
      ></path>
    );
  });
  return (
    <svg
      className={classes.Arc}
      viewBox={`0 0 ${width} ${height}`}
      overflow={"visible"}
    >
      {elements}
    </svg>
  );
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
