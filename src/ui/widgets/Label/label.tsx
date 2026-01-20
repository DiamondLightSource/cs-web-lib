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
  MacrosPropOpt,
  StringOrNumPropOpt
} from "../propTypes";
import { Typography as MuiTypography, styled, useTheme } from "@mui/material";
import { calculateRotationTransform } from "../utils";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

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
  wrapWords: BoolPropOpt,
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt
};

const LabelWidgetProps = {
  ...LabelProps,
  ...WidgetPropType
};

const Typography = styled(MuiTypography)({
  display: "flex",
  overflow: "hidden",
  borderRadius: "4px",
  borderWidth: "0px",
  lineHeight: 1,
  padding: 0
});

export const LabelComponent = (
  props: InferWidgetProps<typeof LabelProps>
): JSX.Element => {
  const theme = useTheme();
  // Default labels to transparent.
  const {
    transparent = true,
    foregroundColor = theme.palette.primary.contrastText,
    textAlign = "left",
    textAlignV = "top",
    text = "",
    rotationStep = 0,
    wrapWords = false,
    visible = true,
    height = WIDGET_DEFAULT_SIZES["label"][1],
    width = WIDGET_DEFAULT_SIZES["label"][0]
  } = props;
  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? theme.palette.primary.main);
  const font = props.font?.css() ?? theme.typography;
  const borderWidth = props.border?.css().borderWidth ?? "0px";
  const borderColor = props.border?.css().borderColor ?? "#000000";
  const borderStyle = props.border?.css().borderStyle ?? "solid";

  const [inputWidth, inputHeight, transform] = calculateRotationTransform(
    rotationStep,
    width,
    height
  );

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
        display: visible ? "flex" : "none",
        justifyContent: alignment,
        alignItems: alignmentV,
        // If size is given as %, rem or vh, allow element to fill parent div
        // Otherwise, use the calculated height that accounts for rotationStep
        height: typeof height === "string" ? "100%" : inputHeight,
        width: typeof width === "string" ? "100%" : inputWidth,
        textAlign: textAlign,
        wordBreak: wrapWords ? "break-word" : null,
        whiteSpace: wrapWords ? "pre-wrap" : "pre",
        color: foregroundColor.toString(),
        backgroundColor: backgroundColor,
        fontFamily: font,
        transform: transform.toString(),
        outlineWidth: borderWidth,
        outlineColor: borderColor,
        outlineStyle: borderStyle
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
