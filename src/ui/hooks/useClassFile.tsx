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

    // Only colors go in the theme palette
    const colorMatches = Object.entries(child)
      .filter(([key]) => CLASS_COLOR_PROPS.has(key))
      .map(([key, value]) => ({ key, value }));

    // Assign colors to palette
    if (colorMatches.length > 0)
      palette[paletteName] = {
        // Put Phoebus theme defaults, overwrite with class props
        ...phoebusTheme.palette[widgetType],
        ...Object.fromEntries(
          colorMatches.map(({ key, value }) => [
            keyMap[key] ?? key,
            value?.colorString ?? undefined
          ])
        )
      };

    // Only colors go in the theme palette
    const fontMatches = Object.entries(child)
      .filter(([key]) => CLASS_FONT_PROPS.has(key))
      .map(([key, value]) => ({ key, value }));

    // Assign fonts to typography
    if (fontMatches.length > 0)
      typography[paletteName] = {
        ...Object.fromEntries(
          fontMatches.map(({ key, value }) => [
            keyMap[key] ?? key,
            fontToCss(value) ?? undefined
          ])
        )
      };

    const borderMatch = child.border;
    if (borderMatch.width > 0)
      borders[paletteName] = {
        // Put Phoebus theme defaults, overwrite with class props
        ...phoebusTheme.borders[widgetType],
        ...borderToCss(borderMatch)
      };
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
