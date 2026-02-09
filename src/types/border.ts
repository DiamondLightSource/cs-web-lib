import { CSSProperties } from "react";
import { Color } from "./color";

export enum BorderStyle {
  None = "None",
  Line = "Line",
  Outset = "Outset",
  Dashed = "Dashed",
  Dotted = "Dotted",
  GroupBox = "GroupBox"
}

const CssBorders: { [key in BorderStyle]: string } = {
  [BorderStyle.None]: "none",
  [BorderStyle.Line]: "solid",
  [BorderStyle.Outset]: "outset",
  [BorderStyle.Dashed]: "dashed",
  [BorderStyle.Dotted]: "dotted",
  // This should already be handled by adding a fieldset element around,
  // although this work is not complete.
  [BorderStyle.GroupBox]: "none"
};

export interface Border {
  style: BorderStyle;
  color: Color;
  // This will render a border width in pixels. I expect that we will revisit this
  // at some later point, possibly to allow or fix to rems.
  width: number;
  radius?: number | null;
}

export const newBorder = (
  style: BorderStyle,
  color: Color,
  width: number,
  radius?: number
): Border => ({ style, color, width, radius });

export const borderToCss = (
  border: Border | undefined
): CSSProperties | undefined =>
  border
    ? {
        borderStyle: CssBorders[border.style],
        borderWidth: `${border.width}px`,
        borderColor: border.color.toString(),
        borderRadius: border.radius ? `${border.radius}px` : undefined
      }
    : undefined;

export const borderNONE = newBorder(BorderStyle.None, Color.BLACK, 0);
