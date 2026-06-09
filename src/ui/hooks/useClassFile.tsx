import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { createTheme, Theme } from "@mui/material";
import { fetchAndConvert } from "./useFile";
import { WidgetDescription } from "../widgets/createComponent";
import { selectClassFile } from "../../redux/slices/configurationSlice";
import { phoebusTheme } from "../../phoebusTheme";

// Map widget props to MUI theme props
const keyMap: Record<string, string> = {
  backgroundColor: "main",
  foregroundColor: "contrastText"
};

const CLASS_PROPS = [
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
  "deselectedColor",
  "borderColor"
];

export function useClassFile(userTheme?: Theme): Theme {
  const classFile = useSelector(selectClassFile);
  //let theme = userTheme ?? phoebusTheme;
  const [theme, setTheme] = useState<Theme>(userTheme ?? phoebusTheme);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const widgetDescription = await fetchAndConvert(
        classFile as string,
        "ca",
        {}
      );
      setTheme(createClassPalettes(widgetDescription));
    };

    if (classFile !== undefined) {
      fetchData();
    }
  }, [classFile]);

  return theme;
}

export function createClassPalettes(classFile: WidgetDescription): Theme {
  // If classfile is empty, do nothing
  if (!classFile.children) return phoebusTheme;

  const palette: { [key: string]: any } = {};
  classFile.children?.forEach((child: WidgetDescription) => {
    const widgetType: string = child.type;
    // Construct palette name from widget type and classname
    const paletteName = `${child.name}${widgetType}`;

    // Only colors go in the theme palette
    const matches = Object.entries(child)
      .filter(([key]) => CLASS_PROPS.includes(key))
      .map(([key, value]) => ({ key, value }));

    // Assign colors to palette
    palette[paletteName] = {
      // Put Phoebus theme defaults, overwrite with class props
      ...phoebusTheme.palette[widgetType],
      ...Object.fromEntries(
        matches.map(({ key, value }) => [keyMap[key] ?? key, value.colorString])
      )
    };
  });
  // Create Theme
  const classTheme = createTheme({
    customName: "class",
    palette: {
      ...phoebusTheme.palette,
      ...palette
    }
  });
  return classTheme;
}
