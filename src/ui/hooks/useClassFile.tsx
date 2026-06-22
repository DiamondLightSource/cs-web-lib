import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { createTheme, Theme } from "@mui/material";
import { fetchAndConvert } from "./useFile";
import { WidgetDescription } from "../widgets/createComponent";
import { selectClassFile } from "../../redux/slices/configurationSlice";
import { phoebusTheme } from "../../phoebusTheme";
import { borderToCss } from "../../types/border";
import { fontToCss } from "../../types/font";
import { addClassStyle } from "../../redux/slices/styleSlice";

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

const DEFAULT_CLASS_PROPS = new Set([
  "children",
  "fileId",
  "id",
  "name",
  "type",
  "position",
  "border",
  "alarmSensitive"
]);

export function useClassFile(userTheme?: Theme): Theme {
  const dispatch = useDispatch();
  const classFile = useSelector(selectClassFile);
  const [theme, setTheme] = useState<Theme>(userTheme ?? phoebusTheme);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const widgetDescription = await fetchAndConvert(
        classFile as string,
        "ca",
        {}
      );
      const [classTheme, classStyle] = createClassTheme(widgetDescription);
      setTheme(classTheme);
      dispatch(addClassStyle({ classes: classStyle }));
    };

    if (classFile !== undefined) {
      fetchData();
    }
  }, [classFile, userTheme, dispatch]);

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
      .filter(([, v]) => v !== undefined)
  );
}

export function extractStyleProps(
  widget: WidgetDescription,
  disallowedProps: Set<string>
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(widget)
      .filter(([key]) => !disallowedProps.has(key))
      .map(([key, value]) => [key, value ?? undefined])
  );
}

export function createClassTheme(classFile: WidgetDescription): [Theme, any] {
  // If classfile is empty, do nothing
  if (!classFile) return [phoebusTheme, {}];

  const colour = extractThemeProps(
    classFile,
    CLASS_COLOR_PROPS,
    value => value?.colorString
  );
  const palette: { [key: string]: any } = Object.keys(colour).length
    ? { [`${classFile.name}display`]: colour }
    : {};
  const styling = extractStyleProps(
    classFile,
    new Set([...CLASS_FONT_PROPS, ...CLASS_COLOR_PROPS, ...DEFAULT_CLASS_PROPS])
  );
  const style: { [key: string]: any } = Object.keys(styling).length
    ? { [`${classFile.name}display`]: styling }
    : {};
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

    // Pass all remaining props to the generic style
    const styleProps = extractStyleProps(
      child,
      new Set([
        ...CLASS_FONT_PROPS,
        ...CLASS_COLOR_PROPS,
        ...DEFAULT_CLASS_PROPS
      ])
    );
    if (Object.keys(styleProps).length) style[paletteName] = styleProps;
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
  return [classTheme, style];
}
