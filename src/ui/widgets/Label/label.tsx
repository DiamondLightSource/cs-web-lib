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
import { Typography, ThemeProvider } from "@mui/material";
import { defaultColours } from "../../../colourscheme";

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
  rotationAngle: FloatPropOpt,
  wrapWords: BoolPropOpt
};

const LabelWidgetProps = {
  ...LabelProps,
  ...WidgetPropType
};

export const LabelComponent = (
  props: InferWidgetProps<typeof LabelProps>
): JSX.Element => {
  // Default labels to transparent.

  const transparent = props.transparent ?? true;

  const {
    textAlign = "left",
    textAlignV = "top",
    text = "",
    rotationAngle,
    wrapWords
  } = props;
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

  let transform = undefined;
  if (rotationAngle) {
    transform = `rotate(${rotationAngle}deg)`;
  }

  // Simple component to display text - defaults to black text and dark grey background
  return (
    <ThemeProvider theme={defaultColours}>
      <Typography
        noWrap={!wrapWords}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: alignment,
          alignItems: alignmentV,
          textAlign: textAlign,
          wordBreak: wrapWords ? "break-word" : null,
          whiteSpace: wrapWords ? "break-spaces" : null,
          color:
            props.foregroundColor?.toString() ??
            defaultColours.palette.primary.contrastText,
          backgroundColor: transparent
            ? null
            : (props.backgroundColor?.toString() ??
              defaultColours.palette.primary.main),
          fontFamily: props.font?.css() ?? null,
          transform: transform?.toString() ?? null
        }}
      >
        {text}
      </Typography>
    </ThemeProvider>
  );
};

export const Label = (
  props: InferWidgetProps<typeof LabelWidgetProps>
): JSX.Element => <Widget baseWidget={LabelComponent} {...props} />;

registerWidget(Label, LabelWidgetProps, "label");
