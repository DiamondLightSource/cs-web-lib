import React, { useState, useContext } from "react";

import { Widget } from "../widget";
import { useStyle } from "../../hooks/useStyle";
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

const widgetName = "display";

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

type DisplayComponentProps = InferWidgetProps<typeof DisplayProps> & {
  id: string;
  class?: string;
};

// Generic display widget to put other things inside
export const DisplayComponent = (props: DisplayComponentProps): JSX.Element => {
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

  const [style, rawProps] = useStyle(props, widgetName, props.class);
  const newProps = rawProps as DisplayComponentProps;

  let extendedStyle: React.CSSProperties = {
    ...style.colors,
    ...style.border,
    ...style.other,
    ...style.font,
    position: "relative",
    overflow: newProps.overflow,
    height: "100%"
  };

  // Check whether the scaling property has been set and if
  // not set the scaling to 1 (i.e. no scaling)
  const internalScaleX = getOptionalValue(newProps.scaling?.at(0), "1");
  const internalScaleY = getOptionalValue(newProps.scaling?.at(1), "1");
  // Only configure the scaling transform if autoZoomToFit is
  // true AND the scale factor provided is not 1 where 1
  // implies no scaling
  if (
    newProps.autoZoomToFit &&
    internalScaleX !== "1" &&
    internalScaleY !== "1"
  ) {
    extendedStyle = {
      ...extendedStyle,
      transform: `scale(${internalScaleX}, ${internalScaleY})`,
      transformOrigin: getOptionalValue(newProps.scalingOrigin, "center top")
    };
  }
  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div style={extendedStyle} className="display">
        <>{newProps.children}</>
      </div>
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

registerWidget(Display, DisplayWidgetProps, widgetName);
