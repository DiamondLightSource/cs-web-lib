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

const GroupBoxProps = {
  name: StringProp,
  children: ChildrenPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  font: FontPropOpt,
  compat: BoolPropOpt,
  boxStyle: IntPropOpt,
  transparent: BoolPropOpt
};

// Widget that renders a group-box style border showing the name prop.
// This could be replaced if we can implement this as part of the
// border prop.
export const GroupBoxComponent = (
  props: InferWidgetProps<typeof GroupBoxProps>
): JSX.Element => {
  const {
    compat = false,
    backgroundColor = Color.fromRgba(240, 240, 240),
    foregroundColor = Color.fromRgba(0, 0, 0),
    font = new Font(16),
    boxStyle = 0,
    transparent = false
  } = props;

  // Manually render a group-box style border.
  const innerDivStyle: CSSProperties = {
    position: "relative",
    overflow: "visible"
  };
  const style: CSSProperties = {
    width: "100%",
    height: "100%",
    padding: "0px",
    paddingLeft: "8px",
    border: "1px solid black",
    whiteSpace: "nowrap",
    overflow: "visible",
    backgroundColor: transparent ? "transparent" : backgroundColor.toString(),
    color: foregroundColor.toString(),
    ...font.css()
  };

  if (boxStyle === 0) {
    // Typical group box with label
  } else if (boxStyle === 1) {
    // Title bar

  } else if (boxStyle === 2) {
    // Border only

  } else {
    // None
    style.border = "none"

  }
  // Specific styling to match the group boxes in opibuilder.
  if (compat) {
    innerDivStyle.paddingLeft = "5px";
    innerDivStyle.height = "100%";
    innerDivStyle.width = "100%";
    innerDivStyle.overflow = "visible";
  }

  return (
    <div style={{
      padding: "10px", paddingTop: "0px", width: "100%",
      height: "100%",
      position: "absolute",
    }}>
      <Box component="fieldset" sx={style}>
        <legend>{props.name}</legend>
        <div style={innerDivStyle}>{props.children}</div>
      </Box>
    </div>

  );
};

const GroupBoxWidgetProps = {
  ...WidgetPropType,
  name: StringProp,
  children: ChildrenPropOpt
};

export const GroupBox = (
  props: InferWidgetProps<typeof GroupBoxWidgetProps>
): JSX.Element => <Widget baseWidget={GroupBoxComponent} {...props} />;

registerWidget(GroupBox, GroupBoxWidgetProps, "groupbox");
