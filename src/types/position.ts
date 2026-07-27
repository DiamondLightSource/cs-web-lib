import { CSSProperties } from "react";

export enum PositionType {
  ABSOLUTE = "ABSOLUTE",
  RELATIVE = "RELATIVE"
}

export interface Position {
  x: string | number;
  y: string | number;
  width: string | number;
  height: string | number;
  margin: string | number;
  padding: string | number;
  minWidth: string | number;
  maxWidth: string | number;
  minHeight: string | number;
  positionType: PositionType;
}

const invalidSize = (size?: string | number): boolean =>
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
  x: string | number,
  y: string | number,
  width: string | number,
  height: string | number,
  margin: string | number = "",
  padding: string | number = "",
  minWidth: string | number = "",
  maxWidth: string | number = "",
  minHeight: string | number = ""
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
  x: string | number = "",
  y: string | number = "",
  width: string | number = "",
  height: string | number = "",
  margin: string | number = "",
  padding: string | number = "",
  minWidth: string | number = "",
  maxWidth: string | number = "",
  minHeight: string | number = ""
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

const toCssUnit = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (value === "0") {
    return "0";
  }

  if (
    typeof value === "string" &&
    (value.includes("%") ||
      value.includes("vh") ||
      value.includes("vw") ||
      value.includes("em") ||
      value.includes("rem"))
  ) {
    return value;
  }

  if (!isNaN(Number(value)) || typeof value === "number") {
    return `${value}px`;
  }

  return value;
};
