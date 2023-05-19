import React, { useState, useContext } from "react";

import { Widget, commonCss } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  ChoicePropOpt,
  ChildrenPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  BorderPropOpt,
  MacrosPropOpt,
  StringPropOpt,
  BoolPropOpt
} from "../propTypes";
import {
  MacroMap,
  MacroContext,
  MacroContextType
} from "../../../types/macros";

const DisplayProps = {
  children: ChildrenPropOpt,
  overflow: ChoicePropOpt(["scroll", "hidden", "auto", "visible"]),
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  macros: MacrosPropOpt,
  scaling: StringPropOpt,
  autoZoomToFit: BoolPropOpt,
  scalingOrigin: StringPropOpt
};

// Generic display widget to put other things inside
export const DisplayComponent = (
  props: InferWidgetProps<typeof DisplayProps> & { id: string }
): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
  const inheritedMacros: MacroMap = useContext(MacroContext).macros;
  const [displayMacros, setDisplayMacros] = useState<MacroMap>(
    props.macros ?? {}
  );
  const displayMacroContext: MacroContextType = {
    updateMacro: (key: string, value: string): void => {
      setDisplayMacros({ ...displayMacros, [key]: value });
    },
    macros: {
      ...inheritedMacros, // lower priority
      ...displayMacros, // higher priority
      DID: props.id // highest priority
    }
  };
  const style = commonCss(props);
  style["position"] = "relative";
  style["overflow"] = props.overflow;
  style["height"] = "100%";
  const internalScale =
    typeof props.scaling === "undefined" ? "1" : props.scaling;
  if (props.autoZoomToFit && internalScale !== "1") {
    style["transform"] = "scale(" + internalScale + ")";
    const scalingOrigin =
      typeof props.scalingOrigin === "undefined"
        ? "center top"
        : props.scalingOrigin;
    style["transformOrigin"] = scalingOrigin;
  }
  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div style={style}>{props.children}</div>
    </MacroContext.Provider>
  );
};

const DisplayWidgetProps = {
  ...DisplayProps,
  ...WidgetPropType
};

export const Display = (
  props: InferWidgetProps<typeof DisplayWidgetProps>
): JSX.Element => <Widget baseWidget={DisplayComponent} {...props} />;

registerWidget(Display, DisplayWidgetProps, "display");
