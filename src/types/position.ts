import { CSSProperties } from "react";

export enum PositionType {
  ABSOLUTE = "ABSOLUTE",
  RELATIVE = "RELATIVE"
}

export interface Position {
  x: string;
  y: string;
  width: string;
  height: string;
  margin: string;
  padding: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  positionType: PositionType;
}

const invalidSize = (size?: string): boolean =>
  size === "" || size === undefined;

export type PositionPropNames =
  | "x"
  | "y"
  | "width"
  | "height"
  | "margin"
  | "padding"
  | "minWidth"
  | "maxWidth"
  | "minHeight"
  | "positionType";

export const newAbsolutePosition = (
  x: string,
  y: string,
  width: string,
  height: string,
  margin = "",
  padding = "",
  minWidth = "",
  maxWidth = "",
  minHeight = ""
): Position => {
  if (
    invalidSize(x) ||
    invalidSize(y) ||
    invalidSize(width) ||
    invalidSize(height)
  ) {
    throw new Error(`Invalid AbsolutePosition (${x},${y},${width},${height})`);
  }
  return {
    x,
    y,
    width,
    height,
    margin,
    padding,
    minWidth,
    maxWidth,
    minHeight,
    positionType: PositionType.ABSOLUTE
  };
};

export const newRelativePosition = (
  x = "",
  y = "",
  width = "",
  height = "",
  margin = "",
  padding = "",
  minWidth = "",
  maxWidth = "",
  minHeight = ""
): Position => ({
  x,
  y,
  width,
  height,
  margin,
  padding,
  minWidth,
  maxWidth,
  minHeight,
  positionType: PositionType.RELATIVE
});

export const positionToString = (position: Position): string => {
  if (position.positionType === PositionType.RELATIVE) {
    return `RelativePosition (${position.width},${position.height})`;
  }

  return `AbsolutePosition (${position.x},${position.y},${position.width},${position.height})`;
};

export const positionToCss = (position: Position): CSSProperties => {
  if (position.positionType === PositionType.RELATIVE) {
    return {
      position: "relative",
      width: toCssUnit(position.width),
      height: toCssUnit(position.height),
      margin: toCssUnit(position.margin),
      padding: toCssUnit(position.padding),
      minWidth: toCssUnit(position.minWidth),
      maxWidth: toCssUnit(position.maxWidth),
      minHeight: toCssUnit(position.minHeight)
    };
  }

  return {
    position: "absolute",
    top: toCssUnit(position.y),
    left: toCssUnit(position.x),
    width: toCssUnit(position.width),
    height: toCssUnit(position.height),
    margin: toCssUnit(position.margin),
    padding: toCssUnit(position.padding),
    minWidth: toCssUnit(position.minWidth),
    maxWidth: toCssUnit(position.maxWidth),
    minHeight: toCssUnit(position.minHeight)
  };
};

const toCssUnit = (value: string | undefined): string => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (value === "0") {
    return "0";
  }

  if (!isNaN(Number(value))) {
    return `${value}px`;
  }

  return value;
};
