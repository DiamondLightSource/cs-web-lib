import { CSSProperties } from "react";

// assigned int values starting from zero
// also functions as a type
export enum FontStyle {
  Regular,
  Bold,
  Italic,
  BoldItalic
}

export class Font {
  // If no number is provided inherit from CSS.
  private size?: number;
  private style: FontStyle;
  private typeface: string;
  // TODO: name is currently unused
  private name?: string;

  public constructor(
    size?: number,
    style?: FontStyle,
    typeface?: string,
    name?: string
  ) {
    this.typeface = typeface ?? "Liberation sans";
    this.style = style ?? FontStyle.Regular;
    this.size = size;
    this.name = name;
  }

  /**
   * Returns a CSSProperties object containing all parameters defined by the
   * user and default properties for optional parameters not input by the user
   */
  public css(): CSSProperties {
    // Convert from px to REM by dividing pixels by default browser font size 16px
    // If a user has manually adjusted their browser font size, this might not be scaled
    // correctly, but given bob screens are pixel placed we shouldn't expect this to scale
    const fontSize = this.size ? `${this.size / 16}rem` : undefined;
    const fontWeight =
      this.style === FontStyle.Bold || this.style === FontStyle.BoldItalic
        ? "bold"
        : "normal";
    const fontStyle =
      this.style === FontStyle.Italic || this.style === FontStyle.BoldItalic
        ? "italic"
        : "normal";
    const style: CSSProperties = {
      // Fall back to sans-serif.
      fontFamily: `${this.typeface},sans-serif`,
      fontWeight: fontWeight,
      fontStyle: fontStyle
    };
    if (fontSize) {
      style.fontSize = fontSize;
    }
    return style;
  }
}
