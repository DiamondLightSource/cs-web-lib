/* A component to load files directly. */

import React, { useContext } from "react";
import log from "loglevel";

import { errorWidget, widgetDescriptionToComponent } from "../createComponent";
import { Color } from "../../../types/color";
import { Border, BorderStyle } from "../../../types/border";
import {
  MacroContext,
  MacroContextType,
  resolveMacros
} from "../../../types/macros";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  FilePropType,
  BoolPropOpt,
  StringPropOpt,
  StringOrNumPropOpt
} from "../propTypes";
import { GroupBoxComponent } from "../GroupBox/groupBox";
import { useOpiFile } from "./useOpiFile";
import { useId } from "react-id-generator";
import { getOptionalValue, trimFromString } from "../utils";
import { Theme, ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";

const RESIZE_STRINGS = [
  "scroll-widget",
  "size-content",
  "crop-widget",
  "stretch-content",
  "crop-content"
];

export interface EmbeddedDisplayPropsExtra {
  theme?: Theme;
}

const EmbeddedDisplayProps = {
  ...WidgetPropType,
  file: FilePropType,
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt,
  name: StringPropOpt,
  scroll: BoolPropOpt,
  scalingOrigin: StringPropOpt,
  overrideAutoZoomToFitValue: BoolPropOpt,
  resize: StringOrNumPropOpt
};

export const EmbeddedDisplay = (
  props: InferWidgetProps<typeof EmbeddedDisplayProps> &
    EmbeddedDisplayPropsExtra
): JSX.Element => {
  const description = useOpiFile(props.file);
  const id = useId();
  let resize = props.resize || "scroll-content";
  // If number, convert back to string
  if (typeof resize === "number") resize = RESIZE_STRINGS[resize];

  log.debug(description);

  // The autoZoomToFit value is parsed directly from the opi input file. This
  // can be overridden by a property set on the EmbeddedDisplay widget. Check
  // whether this override property has been set. If so then the value of this
  // property will be used instead of the opi autoZoomToFit value. If it has
  // not been set then the value from the opi autoZoomToFit parameter is used
  let applyAutoZoomToFit = getOptionalValue(
    props.overrideAutoZoomToFitValue,
    description.autoZoomToFit
  );

  // Get the screen height and width. If not provided then set to
  // the window height and width, repectively.
  const heightString = getOptionalValue(
    description.position.height,
    `${String(window.innerHeight)}px`
  );
  const widthString = getOptionalValue(
    description.position.width,
    `${String(window.innerWidth)}px`
  );

  let overflow = props.scroll ? "auto" : "hidden";
  // Resize prop determines if embedded display is cropped, resized etc
  switch (resize) {
    case "scroll-content":
      // Give the display scrollbars if needed
      overflow = "auto";
      break;
    case "size-content":
      // Resize the content
      applyAutoZoomToFit = true;
      overflow = "visible";
      break;
    case "size-widget":
      // Resize the widget to match content size
      overflow = "visible";
      break;
    case "stretch-content":
      // Stretch content to fit
      overflow = "visible";
      applyAutoZoomToFit = true;
      break;
    case "crop-content":
      // Crop the new content smaller
      overflow = "hidden";
      break;
  }

  let scaleFactorX = "1";
  let scaleFactorY = "1";
  if (applyAutoZoomToFit) {
    // Height and width from parsed opi file will always take the form
    // "<num>px" so trim
    const heightInt = trimFromString(heightString);
    const widthInt = trimFromString(widthString);
    // Use the window size and display size to scale
    let scaleHeightVal = window.innerHeight / heightInt;
    let scaleWidthVal = window.innerWidth / widthInt;
    // If we are scaling down opi to fit into embedded window size use
    // display size and file size
    if (resize === "stretch-content" || resize === "size-content") {
      // Height and width from parsed opi file will always take the form
      // "<num>px" but bob files can be numbers
      if (typeof props.height === "string") {
        scaleHeightVal = trimFromString(props.height) / heightInt;
      } else if (typeof props.height === "number") {
        scaleHeightVal = props.height / heightInt;
      }

      if (typeof props.width === "string") {
        scaleWidthVal = trimFromString(props.width) / widthInt;
      } else if (typeof props.width === "number") {
        scaleWidthVal = props.width / widthInt;
      }
    }

    const minScaleFactor = Math.min(scaleWidthVal, scaleHeightVal);
    // For everything except stretch-content, scale equally in both directions
    if (resize !== "stretch-content") {
      scaleHeightVal = minScaleFactor;
      scaleWidthVal = minScaleFactor;
    }
    scaleFactorX = String(scaleWidthVal);
    scaleFactorY = String(scaleHeightVal);
  }

  const displayChildren = getOptionalValue(description.children, []);
  for (let i = 0; i < displayChildren.length; i++) {
    // Check for nested embeddedDisplays
    if (displayChildren[i].type === "embeddedDisplay") {
      if (applyAutoZoomToFit) {
        // If we have scaled the parent then do not scale
        // the child display as this will result in double scaling
        displayChildren[i].overrideAutoZoomToFitValue = false;
      } else {
        // Otherwise pass on the scalingOrigin so if the child should
        // be scaled, then it will use the same transform-origin
        displayChildren[i].scalingOrigin = props.scalingOrigin;
        // Update the parent container area to be the full area for the child
        // embedded display so it can be scaled into it if needed. Note height
        // from parsed opi file will always take the form "<num>px" so trim
        if (window.innerHeight > trimFromString(heightString)) {
          props.position.height = `${String(window.innerHeight)}px`;
        }
      }
    }
  }

  let component: JSX.Element;
  try {
    component = widgetDescriptionToComponent({
      type: "display",
      position: props.position,
      backgroundColor:
        description.backgroundColor ?? new Color("rgb(200,200,200"),
      border:
        props.border ?? new Border(BorderStyle.Line, new Color("white"), 0),
      overflow: overflow,
      children: [description],
      scaling: [scaleFactorX, scaleFactorY],
      autoZoomToFit: applyAutoZoomToFit,
      scalingOrigin: props.scalingOrigin
    });
  } catch (e) {
    const message = `Error loading ${props.file.path}: ${e}.`;
    log.warn(message);
    log.warn(e);
    component = widgetDescriptionToComponent(errorWidget(message));
  }

  // Include and override parent macros with those from the prop.
  const parentMacros = useContext(MacroContext).macros;
  const embeddedDisplayMacros = props.file.macros ?? {};
  const embeddedDisplayMacroContext: MacroContextType = {
    // Currently not allowing changing the macros of an embedded display.
    updateMacro: (key: string, value: string): void => {},
    macros: {
      ...parentMacros, // lower priority
      ...embeddedDisplayMacros, // higher priority
      LCID: id.toString() // highest priority
    }
  };

  // Awkward to have to do this manually. Can we make this more elegant?
  const resolvedName = resolveMacros(
    props.name ?? "",
    embeddedDisplayMacroContext.macros
  );

  if (props.border?.style === BorderStyle.GroupBox) {
    return (
      <ThemeProvider theme={props.theme ?? phoebusTheme}>
        <MacroContext.Provider value={embeddedDisplayMacroContext}>
          <GroupBoxComponent name={resolvedName} styleOpt={0}>
            {component}
          </GroupBoxComponent>
        </MacroContext.Provider>
      </ThemeProvider>
    );
  } else {
    return (
      <ThemeProvider theme={props.theme ?? phoebusTheme}>
        <MacroContext.Provider value={embeddedDisplayMacroContext}>
          {component}
        </MacroContext.Provider>
      </ThemeProvider>
    );
  }
};

registerWidget(EmbeddedDisplay, EmbeddedDisplayProps, "embeddedDisplay");
