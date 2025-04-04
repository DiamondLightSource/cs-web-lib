import React from "react";

import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  InferWidgetProps,
  StringPropOpt,
  ChoicePropOpt,
  FontPropOpt,
  ColorPropOpt,
  BorderPropOpt,
  FloatPropOpt,
  MacrosPropOpt
} from "../propTypes";
import { Typography as MuiTypography, styled } from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";

const LabelProps = {
  macros: MacrosPropOpt,
  text: StringPropOpt,
  visible: BoolPropOpt,
  transparent: BoolPropOpt,
  className: StringPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"]),
  textAlignV: ChoicePropOpt(["top", "center", "bottom"]),
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  rotationStep: FloatPropOpt,
  wrapWords: BoolPropOpt
};

const LabelWidgetProps = {
  ...LabelProps,
  ...WidgetPropType
};

const Typography = styled(MuiTypography)({
  width: "100%",
  height: "100%",
  display: "flex",
  overflow: "hidden",
  padding: 0
});

export const LabelComponent = (
  props: InferWidgetProps<typeof LabelProps>
): JSX.Element => {
  // Default labels to transparent.
  const {
    transparent = true,
    foregroundColor = diamondTheme.palette.primary.contrastText,
    textAlign = "left",
    textAlignV = "top",
    text = "",
    rotationStep = 0,
    wrapWords = true
  } = props;
  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? diamondTheme.palette.primary.main);
  const font = props.font?.css() ?? diamondTheme.typography;

  // Since display is "flex", use "flex-start" and "flex-end" to align
  // the content.
  let alignment = "center";
  if (textAlign === "left") {
    alignment = "flex-start";
  } else if (textAlign === "right") {
    alignment = "flex-end";
  }

  let alignmentV = "center";
  if (textAlignV === "top") {
    alignmentV = "flex-start";
  } else if (textAlignV === "bottom") {
    alignmentV = "flex-end";
  }

  // Simple component to display text - defaults to black text and dark grey background
  return (
    <Typography
      noWrap={!wrapWords}
      sx={{
        justifyContent: alignment,
        alignItems: alignmentV,
        textAlign: textAlign,
        wordBreak: wrapWords ? "break-word" : null,
        whiteSpace: wrapWords ? "break-spaces" : null,
        color: foregroundColor.toString(),
        backgroundColor: backgroundColor,
        fontFamily: font,
        transform: `rotate(${rotationStep * -90}deg)`.toString()
      }}
    >
      {text}
    </Typography>
  );
};

export const Label = (
  props: InferWidgetProps<typeof LabelWidgetProps>
): JSX.Element => <Widget baseWidget={LabelComponent} {...props} />;

registerWidget(Label, LabelWidgetProps, "label");
