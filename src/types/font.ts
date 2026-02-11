import { CSSProperties } from "react";

// assigned int values starting from zero
// also functions as a type
export enum FontStyle {
  Regular = "Regular",
  Bold = "Bold",
  Italic = "Italic",
  BoldItalic = "BoldItalic"
}

export interface Font {
  size?: number | null;
  style: FontStyle;
  typeface: string;
  name?: string | null;
}

export const newFont = (
  size?: number,
  style?: FontStyle,
  typeface?: string,
  name?: string
): Font => ({
  size: size ?? 14,
  style: style ?? FontStyle.Regular,
  typeface: typeface ?? "Liberation sans",
  name
});

/**
 * Returns a CSSProperties object containing all parameters defined by the
 * user and default properties for optional parameters not input by the user
 */
export const fontToCss = (font?: Font): CSSProperties | undefined => {
  // Convert from px to REM by dividing pixels by default browser font size 16px
  // If a user has manually adjusted their browser font size, this might not be scaled
  // correctly, but given bob screens are pixel placed we shouldn't expect this to scale

  if (!font) return undefined;

  const fontSize = font.size ? `${font.size / 16}rem` : undefined;
  const fontWeight =
    font.style === FontStyle.Bold || font.style === FontStyle.BoldItalic
      ? "bold"
      : "normal";
  const fontStyle =
    font.style === FontStyle.Italic || font.style === FontStyle.BoldItalic
      ? "italic"
      : "normal";
  const style: CSSProperties = {
    // Fall back to sans-serif.
    fontFamily: `${font.typeface},sans-serif`,
    fontWeight: fontWeight,
    fontStyle: fontStyle
  };
  if (fontSize) {
    style.fontSize = fontSize;
  }
  return style;
};
