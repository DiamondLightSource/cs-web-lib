import React from "react";
import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts";

export type TriangleProps = {
  value: number;
  size?: number;
  fill?: string;
};

export const TrianglePointerHorizontal: React.FC<TriangleProps> = ({
  value: xValue,
  size = 10,
  fill = "#000000ff"
}: TriangleProps) => {
  const xScale = useXScale();
  const { top, left, width } = useDrawingArea();

  const xCoord = xScale(xValue);
  if (!xCoord || xCoord < left || xCoord > left + width) {
    return null;
  }

  if (xCoord < left) {
    return null;
  }

  // Displace from top axis
  const yCenter = top - 1;

  const half = size / 2;
  const points = [
    `${xCoord},${yCenter}`,
    `${xCoord + half},${yCenter - size}`,
    `${xCoord - half},${yCenter - size}`
  ].join(" ");

  return <polygon points={points} fill={fill} />;
};

export const TrianglePointerVertical: React.FC<TriangleProps> = ({
  value: xValue,
  size = 10,
  fill = "#000000ff"
}: TriangleProps) => {
  const yScale = useYScale();
  const { left, top, height } = useDrawingArea();

  const yCoord = yScale(xValue);
  if (!yCoord || yCoord < top || yCoord > top + height) {
    return null;
  }

  // Displace from left axis
  const xCenter = left - 1;

  const half = size / 2;
  const points = [
    `${xCenter},${yCoord}`,
    `${xCenter - size},${yCoord - half}`,
    `${xCenter - size},${yCoord + half}`
  ].join(" ");

  return <polygon points={points} fill={fill} />;
};
