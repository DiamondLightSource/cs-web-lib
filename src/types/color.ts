import { colord } from "colord";

export interface Color {
  colorString: string;
}

export const newColor = (colorString: string): Color => ({
  colorString
});

export class ColorUtils {
  public static WHITE = ColorUtils.fromRgba(255, 255, 255);
  public static GREY = ColorUtils.fromRgba(220, 220, 220);
  public static BLACK = ColorUtils.fromRgba(0, 0, 0);
  public static RED = ColorUtils.fromRgba(255, 0, 0);
  public static GREEN = ColorUtils.fromRgba(0, 128, 0);
  public static BLUE = ColorUtils.fromRgba(0, 0, 255);
  public static YELLOW = ColorUtils.fromRgba(255, 255, 0);
  public static PURPLE = ColorUtils.fromRgba(127, 0, 127);
  public static PINK = ColorUtils.fromRgba(255, 192, 203);
  public static ORANGE = ColorUtils.fromRgba(255, 165, 0);
  public static TRANSPARENT = ColorUtils.fromRgba(0, 0, 0, 0);

  public static DISCONNECTED = newColor("var(--disconnected)");
  public static INVALID = newColor("var(--invalid)");
  public static WARNING = newColor("var(--warning)");
  public static ALARM = newColor("var(--alarm)");
  public static CHANGING = newColor("var(--changing)");
  public static UNDEFINED = newColor("var(--undefined)");

  public static fromRgba(r: number, g: number, b: number, a = 1): Color {
    if (r < 0 || r > 255) {
      throw new Error(`r value ${r} out of range`);
    } else if (g < 0 || g > 255) {
      throw new Error(`g value ${g} out of range`);
    } else if (b < 0 || b > 255) {
      throw new Error(`b value ${b} out of range`);
    }

    return newColor(`rgba(${r},${g},${b},${a})`);
  }
}

export const colorChangeAlpha = (color: Color, a: number): Color => {
  return newColor(colord(color.colorString).alpha(a).toRgbString());
};
