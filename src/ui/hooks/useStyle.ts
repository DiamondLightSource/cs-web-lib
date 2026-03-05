import { BorderDef, PaletteColor, Theme, useTheme } from "@mui/material";
import { Border, Color } from "../../types";
import { Font, fontToCss } from "../../types/font";
import { CSSProperties } from "react";
import { borderToCss } from "../../types/border";
import { WidgetActions } from "../widgets/widgetActions";

const selectPalette = (theme: Theme, widgetName?: string): PaletteColor => {
  if (theme?.palette && widgetName && widgetName in theme?.palette) {
    return theme.palette[
      widgetName as keyof typeof theme.palette
    ] as PaletteColor;
  }

  return theme?.palette?.primary;
};

const selectBorder = (theme: Theme, widgetName?: string): BorderDef => {
  if (theme?.borders && widgetName && widgetName in theme?.borders) {
    return theme.borders[widgetName as keyof typeof theme.borders] as BorderDef;
  }
  return theme?.borders?.default;
};

const foregroundColorSelector = (
  themePalette: PaletteColor,
  foregroundColor?: Color
): string => foregroundColor?.colorString ?? themePalette?.contrastText;

const backgroundColorSelector = (
  themePalette: PaletteColor,
  backgroundColor?: Color,
  transparent?: boolean
): string =>
  transparent
    ? "transparent"
    : (backgroundColor?.colorString ?? themePalette?.main);

const fontSelector = (theme: Theme, font?: Font): CSSProperties =>
  fontToCss(font) ?? (theme.typography as CSSProperties);

/**
 * Return a CSSProperties object for props that multiple widgets may have.
 * @param props properties of the widget to be formatted
 * @returns a CSSProperties object to pass into another element under the style key
 */
export const useStyle = (
  props: {
    border?: Border;
    font?: Font;
    visible?: boolean;
    foregroundColor?: Color;
    backgroundColor?: Color;
    transparent?: boolean;
    actions?: WidgetActions;
    customColors?: { [key: string]: Color | undefined };
  },
  widgetName?: string
) => {
  const theme = useTheme();
  const themePalette = selectPalette(theme, widgetName);
  const themeBorder = selectBorder(theme, widgetName);
  const propsBorder = borderToCss(props.border);
  const border = {
    borderStyle: propsBorder?.borderStyle ?? themeBorder?.borderStyle,
    borderWidth: propsBorder?.borderWidth ?? themeBorder?.borderWidth,
    borderColor: propsBorder?.borderColor ?? themeBorder?.borderColor,
    borderRadius: propsBorder?.borderRadius ?? themeBorder?.borderRadius
  };

  const visible = props.visible === undefined || props.visible;

  const foregroundColor = foregroundColorSelector(
    themePalette,
    props?.foregroundColor
  );
  const backgroundColor = backgroundColorSelector(
    themePalette,
    props?.backgroundColor,
    props.transparent
  );

  const customColors: { [key: string]: string } = Object.fromEntries(
    Object.entries(themePalette)
      .map(([key, value]) => {
        if (key === "contrastText" || key === "main") {
          return [null, null];
        }
        if (
          props?.customColors &&
          key in props?.customColors &&
          props.customColors[key]
        ) {
          return [key, props.customColors[key]?.colorString];
        }
        return [key, value];
      })
      .filter(x => x[0] != null)
  );

  const font = fontSelector(theme, props?.font);

  const cursor =
    props.actions && props.actions.actions.length > 0 ? "pointer" : "auto";

  const other: CSSProperties = {
    cursor,
    visibility: visible ? "visible" : "hidden"
  };

  return {
    border,
    font,
    colors: {
      color: foregroundColor,
      backgroundColor
    },
    customColors,
    other
  };
};
