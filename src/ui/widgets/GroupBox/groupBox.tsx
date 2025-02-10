import React, { CSSProperties } from "react";

import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  StringProp,
  ChildrenPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  BoolPropOpt,
  FontPropOpt,
  IntPropOpt
} from "../propTypes";
import { Font } from "../../../types/font";
import { Color } from "../../../types/color";
import Box from "@mui/material/Box";

const INNER_DIV_STYLE: CSSProperties = {
  position: "relative",
  overflow: "visible"
};

const GroupBoxProps = {
  name: StringProp,
  children: ChildrenPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  font: FontPropOpt,
  styleOpt: IntPropOpt,
  transparent: BoolPropOpt
};

// Widget that renders a group-box style border showing the name prop.
// This could be replaced if we can implement this as part of the
// border prop.
export const GroupBoxComponent = (
  props: InferWidgetProps<typeof GroupBoxProps>
): JSX.Element => {
  const {
    backgroundColor = Color.fromRgba(240, 240, 240),
    foregroundColor = Color.fromRgba(0, 0, 0),
    font = new Font(16),
    styleOpt = 0,
    transparent = false
  } = props;

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
    border: "1px solid black",
    whiteSpace: "nowrap",
    overflow: "visible",
    backgroundColor: transparent ? "transparent" : backgroundColor.toString(),
    color: foregroundColor.toString(),
    ...font.css()
  };

  if (styleOpt === 0) {
    // Typical group box with label
    outerDivStyle.padding = "10px";
    outerDivStyle.paddingTop = "0px";
    boxStyle.paddingLeft = "8px";
  } else if (styleOpt === 3) {
    // No groupbox
    boxStyle.border = "none";
  }

  return (
    <div style={outerDivStyle}>
      <Box component="fieldset" sx={boxStyle}>
        {styleOpt === 1 ? (
          <div
            style={{
              height: "20px",
              width: "100%",
              backgroundColor: foregroundColor.toString(),
              ...font.css(),
              color: backgroundColor.toString()
            }}
          >
            {props.name}
          </div>
        ) : (
          <></>
        )}
        {styleOpt === 0 ? <legend>{props.name}</legend> : <></>}
        <div style={INNER_DIV_STYLE}>{props.children}</div>
      </Box>
    </div>
  );
};

const GroupBoxWidgetProps = {
  ...WidgetPropType,
  ...GroupBoxProps,
  name: StringProp,
  children: ChildrenPropOpt
};

export const GroupBox = (
  props: InferWidgetProps<typeof GroupBoxWidgetProps>
): JSX.Element => <Widget baseWidget={GroupBoxComponent} {...props} />;

registerWidget(GroupBox, GroupBoxWidgetProps, "groupbox");
