import { BorderDef, PaletteColor, Theme, useTheme } from "@mui/material";
import { Border, Color } from "../../types";
import { Font, fontToCss } from "../../types/font";
import { CSSProperties } from "react";
import { borderToCss } from "../../types/border";
import { WidgetActions } from "../widgets/widgetActions";
import { useSelector } from "react-redux";
import { selectClassStyle } from "../../redux/slices/styleSlice";

export interface UseStyleResult {
  border: {
    borderStyle?: string;
    borderWidth?: string | number;
    borderColor?: string;
    borderRadius?: string | number;
  };
  font: ReturnType<typeof fontSelector>;
  colors: {
    color?: string;
    backgroundColor?: string;
  };
  customColors: Record<string, string>;
  other: CSSProperties;
}

interface UseStyleProps {
  border?: Border;
  font?: Font;
  visible?: boolean;
  foregroundColor?: Color;
  backgroundColor?: Color;
  transparent?: boolean;
  actions?: WidgetActions;
  customColors?: { [key: string]: Color | undefined };
}

const selectPalette = (theme: Theme, themeName?: string): PaletteColor => {
  if (theme?.palette && themeName && themeName in theme?.palette) {
    return theme.palette[
      themeName as keyof typeof theme.palette
    ] as PaletteColor;
  }

  return theme?.palette?.primary;
};

const selectBorder = (theme: Theme, themeName?: string): BorderDef => {
  if (theme?.borders && themeName && themeName in theme?.borders) {
    return theme.borders[themeName as keyof typeof theme.borders] as BorderDef;
  }
  return theme?.borders?.default;
};

const selectFont = (theme: Theme, themeName?: string): CSSProperties => {
  if (theme?.typography && themeName && themeName in theme?.typography) {
    return theme.typography[
      themeName as keyof typeof theme.typography
    ] as CSSProperties;
  }
  return {
    fontFamily: theme?.typography?.fontFamily ?? "Liberation Sans",
    fontSize: theme?.typography?.fontSize ?? 14
  } as CSSProperties;
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
  props: UseStyleProps,
  widgetName?: string,
  className?: string
): [UseStyleResult, any] => {
  const theme = useTheme();
  const themeName = `${className ?? ""}${widgetName}`;

  // Overwrite normal props with class props
  const style = useSelector(state => selectClassStyle(state, themeName));
  const newProps = {
    ...props,
    ...style
  };

  const themePalette = selectPalette(theme, themeName);
  const themeBorder = selectBorder(theme, themeName);
  const themeFont = selectFont(theme, themeName);

  const propsBorder = borderToCss(props.border);
  const hasClassBorder = Boolean(
    className && theme.borders && themeName in theme?.borders
  );
  const border = hasClassBorder
    ? themeBorder
    : {
        ...themeBorder,
        ...propsBorder
      };

  const visible = props.visible === undefined || props.visible;

  const hasClassColour = Boolean(
    className && theme.palette && themeName in theme?.palette
  );
  // If palette for class exists, use that
  const colors = hasClassColour
    ? {
        color: themePalette.contrastText,
        backgroundColor: themePalette.main
      }
    : {
        color: foregroundColorSelector(themePalette, props.foregroundColor),
        backgroundColor: backgroundColorSelector(
          themePalette,
          props.backgroundColor,
          props.transparent
        )
      };

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

  const hasClassFont = Boolean(
    className && theme.typography && themeName in theme?.typography
  );
  const font = hasClassFont ? themeFont : fontSelector(theme, props?.font);

  const cursor = props.actions?.actions.length ? "pointer" : "auto";

  const other: CSSProperties = {
    cursor,
    visibility: visible ? "visible" : "hidden"
  };

  return [
    {
      border,
      font,
      colors: colors,
      customColors,
      other
    },
    newProps
  ];
};
