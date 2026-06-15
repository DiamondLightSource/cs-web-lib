import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { createTheme, Theme } from "@mui/material";
import { fetchAndConvert } from "./useFile";
import { WidgetDescription } from "../widgets/createComponent";
import { selectClassFile } from "../../redux/slices/configurationSlice";
import { phoebusTheme } from "../../phoebusTheme";
import { borderToCss } from "../../types/border";
import { fontToCss } from "../../types/font";

// Map widget props to MUI theme props
const keyMap: Record<string, string> = {
  backgroundColor: "main",
  foregroundColor: "contrastText"
};

const CLASS_COLOR_PROPS = new Set([
  "offColor",
  "onColor",
  "foregroundColor",
  "backgroundColor",
  "lineColor",
  "emptyColor",
  "knobColor",
  "color",
  "fillColor",
  "needleColor",
  "selectedColor",
  "deselectedColor"
]);

const CLASS_FONT_PROPS = new Set([
  "font",
  "scaleFont",
  "titleFont",
  "labelFont",
  "legendFont"
]);

export function useClassFile(userTheme?: Theme): Theme {
  const classFile = useSelector(selectClassFile);
  const [theme, setTheme] = useState<Theme>(userTheme ?? phoebusTheme);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const widgetDescription = await fetchAndConvert(
        classFile as string,
        "ca",
        {}
      );
      setTheme(createClassTheme(widgetDescription));
    };

    if (classFile !== undefined) {
      fetchData();
    }
  }, [classFile, userTheme]);

  return theme;
}

/**
 * Convert individual widget props into an object
 * containing all class props on the widget, for a given group
 * e.g. all color classes
 * @param widget
 * @param allowedProps set of props for given group
 * @param mapper func that returns correct value for group
 * @returns
 */
export function extractThemeProps(
  widget: WidgetDescription,
  allowedProps: Set<string>,
  mapper: (value: any) => any
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(widget)
      .filter(([key]) => allowedProps.has(key))
      .map(([key, value]) => [keyMap[key] ?? key, mapper(value) ?? undefined])
  );
}

export function createClassTheme(classFile: WidgetDescription): Theme {
  // If classfile is empty, do nothing
  if (!classFile.children) return phoebusTheme;

  const palette: { [key: string]: any } = {};
  const typography: { [key: string]: any } = {};
  const borders: { [key: string]: any } = {};
  classFile.children?.forEach((child: WidgetDescription) => {
    const widgetType: string = child.type;
    // Construct palette name from widget type and classname
    const paletteName = `${child.name}${widgetType}`;

    const colours = extractThemeProps(
      child,
      CLASS_COLOR_PROPS,
      value => value?.colorString
    );
    if (Object.keys(colours).length) palette[paletteName] = colours;

    const fonts = extractThemeProps(child, CLASS_FONT_PROPS, value =>
      fontToCss(value)
    );
    if (Object.keys(fonts).length) typography[paletteName] = fonts;

    borders[paletteName] = borderToCss(child.border);
  });

  // Create Theme
  const classTheme = createTheme({
    customName: "class",
    palette: {
      ...phoebusTheme.palette,
      ...palette
    },
    typography: {
      ...phoebusTheme.typography,
      ...typography
    },
    borders: {
      ...phoebusTheme.borders,
      ...borders
    }
  });
  return classTheme;
}
