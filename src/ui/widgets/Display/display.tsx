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
  BoolPropOpt,
  StringArrayPropOpt
} from "../propTypes";
import {
  MacroMap,
  MacroContext,
  MacroContextType
} from "../../../types/macros";
import { getOptionalValue } from "../utils";

const DisplayProps = {
  children: ChildrenPropOpt,
  overflow: ChoicePropOpt(["scroll", "hidden", "auto", "visible"]),
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  macros: MacrosPropOpt,
  scaling: StringArrayPropOpt,
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
  // Check whether the scaling property has been set and if
  // not set the scaling to 1 (i.e. no scaling)
  const internalScaleX = getOptionalValue(props.scaling?.at(0), "1");
  const internalScaleY = getOptionalValue(props.scaling?.at(1), "1");
  // Only configure the scaling transform if autoZoomToFit is
  // true AND the scale factor provided is not 1 where 1
  // implies no scaling
  if (props.autoZoomToFit && internalScaleX !== "1" && internalScaleY !== "1") {
    style["transform"] = `scale(${internalScaleX}, ${internalScaleY})`;
    const scalingOrigin = getOptionalValue(props.scalingOrigin, "center top");
    style["transformOrigin"] = scalingOrigin;
  }
  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div style={style} className="display">{props.children}</div>
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
