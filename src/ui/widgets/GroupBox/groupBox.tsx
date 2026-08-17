import React, { CSSProperties, useContext } from "react";

import { Widget } from "../widget";
import { WidgetPropType, ComponentProps } from "../widgetProps";
import { registerWidget } from "../register";
import {
  ChildrenPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  BoolPropOpt,
  FontPropOpt,
  IntPropOpt,
  StringPropOpt,
  MacrosPropOpt
} from "../propTypes";
import { fontToCss, newFont } from "../../../types/font";
import Box from "@mui/material/Box";
import { MacroContext, MacroContextType } from "../../../types/macros";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "groupbox";

const INNER_DIV_STYLE: CSSProperties = {
  position: "relative",
  overflow: "visible",
  color: "black"
};

const GroupBoxProps = {
  name: StringPropOpt,
  children: ChildrenPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  lineColor: ColorPropOpt,
  font: FontPropOpt,
  styleOpt: IntPropOpt,
  transparent: BoolPropOpt,
  macros: MacrosPropOpt,
  visible: BoolPropOpt
};

// Widget that renders a group-box style border showing the name prop.
// This could be replaced if we can implement this as part of the
// border prop.
export const GroupBoxComponent = (
  props: InferWidgetProps<typeof GroupBoxProps> & ComponentProps
): JSX.Element => {
  const [style, newProps] = useStyle(
    { ...props, customColors: { lineColor: props.lineColor } },
    widgetName,
    props.class
  );
  const {
    font = newFont(14),
    styleOpt = style.styleOpt,
    transparent = false,
    visible = true,
    backgroundColor = style.colors.backgroundColor,
    foregroundColor = style.colors.color,
    lineColor = style.customColors.lineColor
  } = newProps;

  const outerDivStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    position: "absolute",
    padding: "0px",
    boxSizing: "border-box"
  };

  const boxStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    padding: "0px",
    border: "1px solid " + lineColor,
    whiteSpace: "nowrap",
    overflow: "visible",
    backgroundColor: transparent ? "transparent" : backgroundColor,
    color: foregroundColor,
    visibility: visible ? "visible" : "hidden",
    ...fontToCss(font)
  };

  if (styleOpt === 0) {
    // Typical group box with label
    outerDivStyle.paddingRight = "10px";
    boxStyle.paddingLeft = "8px";
  } else if (styleOpt === 3) {
    // No groupbox
    boxStyle.border = "none";
  }

  let name = "";
  if (props.name !== undefined) {
    name = props.name;
  }

  const parentMacros = useContext(MacroContext).macros;
  const displayMacros = props.macros ?? {};
  const updatedMacroContext: MacroContextType = {
    updateMacro: (key: string, value: string): void => {},
    macros: {
      ...parentMacros,
      ...displayMacros
    }
  };

  return (
    <MacroContext.Provider value={updatedMacroContext}>
      <div style={outerDivStyle}>
        <Box component="fieldset" sx={boxStyle}>
          {styleOpt === 1 ? (
            <div
              style={{
                ...style.customColors,
                ...style.font,
                color: foregroundColor,
                backgroundColor: backgroundColor,
                height: "20px",
                width: "100%"
              }}
            >
              {name}
            </div>
          ) : (
            <></>
          )}
          {styleOpt === 0 ? <legend>{name}</legend> : <></>}
          <div style={INNER_DIV_STYLE}>
            <>{props.children}</>
          </div>
        </Box>
      </div>
    </MacroContext.Provider>
  );
};

const GroupBoxWidgetProps = {
  ...WidgetPropType,
  ...GroupBoxProps,
  name: StringPropOpt,
  children: ChildrenPropOpt
};

export const GroupBox = (
  props: InferWidgetProps<typeof GroupBoxWidgetProps>
): JSX.Element => <Widget baseWidget={GroupBoxComponent} {...props} />;

registerWidget(GroupBox, GroupBoxWidgetProps, "groupbox");
