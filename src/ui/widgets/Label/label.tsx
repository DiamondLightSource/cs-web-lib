import React, { CSSProperties } from "react";

import classes from "./label.module.css";
import { Widget, commonCss } from "../widget";
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
  FloatPropOpt
} from "../propTypes";

const LabelProps = {
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
  const editedProps = {
    ...props,
    transparent: props.transparent ?? true
  };
  const style: CSSProperties = commonCss(editedProps);
  const {
    textAlign = "center",
    textAlignV = "center",
    text = "",
    rotationAngle,
    wrapWords
  } = props;
  const className = props.className ?? `Label ${classes.Label}`;
  // Since display is "flex", use "flex-start" and "flex-end" to align
  // the content.
  let alignment = "center";
  if (textAlign === "left") {
    alignment = "flex-start";
    if (wrapWords) {
      style["textAlign"] = "left";
    }
  } else if (textAlign === "right") {
    alignment = "flex-end";
    if (wrapWords) {
      style["textAlign"] = "right";
    }
  } else {
    if (wrapWords) {
      style["textAlign"] = "center";
    }
  }
  style["justifyContent"] = alignment;
  style["cursor"] = "default";
  let alignmentV = "center";
  if (textAlignV === "top") {
    alignmentV = "flex-start";
  } else if (textAlignV === "bottom") {
    alignmentV = "flex-end";
  }
  style["alignItems"] = alignmentV;
  let transform = undefined;
  if (rotationAngle) {
    transform = `rotate(${rotationAngle}deg)`;
  }

  if (wrapWords) {
    style["wordBreak"] = "break-word";
    style["whiteSpace"] = "pre-line";
  }

  // Simple component to display text - defaults to black text and dark grey background
  return (
    <div className={className} style={style}>
      <span style={{ transform }}> {text} </span>
    </div>
  );
};

export const Label = (
  props: InferWidgetProps<typeof LabelWidgetProps>
): JSX.Element => <Widget baseWidget={LabelComponent} {...props} />;

registerWidget(Label, LabelWidgetProps, "label");
