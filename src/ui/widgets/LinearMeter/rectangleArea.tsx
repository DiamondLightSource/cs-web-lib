import React from "react";
import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts";

export type RectangleAreaProps = {
  minimum: number;
  maximum: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export const RectangleAreaHorizontal: React.FC<RectangleAreaProps> = ({
  minimum,
  maximum,
  fill = "rgba(0, 0, 0, 1)",
  stroke = "rgba(0, 0, 0, 1)",
  strokeWidth = 1
}: RectangleAreaProps) => {
  const { top, height, left, width } = useDrawingArea();
  const xScale = useXScale();

  const x1 = xScale(minimum as any);
  const x2 = xScale(maximum as any);
  if (x1 == null || x2 == null) return null;

  // Prevent possible overflows of chart area
  const x1Limted = Math.max(Math.min(x1, left + width), left);
  const x2Limted = Math.max(Math.min(x2, left + width), left);

  const x = Math.min(x1Limted, x2Limted);
  const deltaX = Math.abs(x2Limted - x1Limted);

  if (deltaX === 0) return null;

  return (
    <rect
      x={x}
      y={top}
      width={deltaX}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      pointerEvents="none"
    />
  );
};

export const RectangleAreaVertical: React.FC<RectangleAreaProps> = ({
  minimum,
  maximum,
  fill = "rgba(0, 0, 0, 1)",
  stroke = "rgba(0, 0, 0, 1)",
  strokeWidth = 1
}: RectangleAreaProps) => {
  const { left, width, top, height } = useDrawingArea();
  const yScale = useYScale();

  const y1 = yScale(minimum as any);
  const y2 = yScale(maximum as any);
  if (y1 == null || y2 == null) return null;

  // Prevent possible overflows of chart area
  const y1Limted = Math.max(Math.min(y1, top + height), top);
  const y2Limted = Math.max(Math.min(y2, top + height), top);

  const y = Math.min(y1Limted, y2Limted);
  const deltaY = Math.abs(y2Limted - y1Limted);

  if (deltaY === 0) return null;

  return (
    <rect
      x={left}
      y={y}
      width={width}
      height={deltaY}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      pointerEvents="none"
    />
  );
};
