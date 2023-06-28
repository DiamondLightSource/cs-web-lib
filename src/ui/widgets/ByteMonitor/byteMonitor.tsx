import React, { CSSProperties } from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  FloatPropOpt,
  ColorPropOpt,
  IntPropOpt,
  BoolPropOpt,
  StringPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import classes from "./byteMonitor.module.css";
import { Color } from "../../../types/color";

export const ByteMonitorProps = {
  width: FloatPropOpt,
  height: FloatPropOpt,
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  numBits: IntPropOpt,
  startBit: IntPropOpt,
  horizontal: BoolPropOpt,
  bitReverse: BoolPropOpt,
  squareLed: BoolPropOpt,
  labels: StringPropOpt,
  ledBorder: IntPropOpt,
  ledBorderColor: ColorPropOpt,
  ledPacked: BoolPropOpt,
  effect3d: BoolPropOpt
};

export type ByteMonitorComponentProps = InferWidgetProps<
  typeof ByteMonitorProps
> &
  PVComponent;

export const ByteMonitorComponent = (
  props: ByteMonitorComponentProps
): JSX.Element => {
  const {
    value,
    numBits = 16,
    startBit = 0,
    horizontal = true,
    bitReverse = false,
    labels = [],
    onColor = Color.fromRgba(0, 255, 0),
    offColor = Color.fromRgba(0, 100, 0),
    ledBorder = 3,
    ledBorderColor = Color.fromRgba(150, 150, 150), // dark grey
    ledPacked = false,
    squareLed = false,
    effect3d = true,
    width,
    height
  } = props;

  const stringValue = value?.getStringValue();
  const bitArray = [];
  // TO DO - LED PACKED
  // TO DO - EFFECT 3D
  // TO DO - HORIZONTAL
  // TO DO - GIVE EACH KEY
  // TO DO - RULES

  if (stringValue !== undefined && width) {
    // Convert string to array of numbers
    const dataValues = stringValue.split(",").map(Number);
    // make sizes similar to size in CS-Studio, five taken
    // away from default in css file too
    const bitWidth = Math.floor(width - 5 / numBits);
    // If multiple bits, loop over them
    for (let i = startBit; i < startBit + numBits; i++) {
      const style: CSSProperties = {};
      let data = dataValues[i];
      // Flip bit. 1 -> 0, 0 -> 1
      if (bitReverse) {
        data = 1 - data;
      }
      // Set color based on bit
      style["backgroundColor"] = data
        ? onColor?.toString()
        : offColor?.toString();
      // Set border color and thickness
      style["borderColor"] = ledBorderColor.toString();
      style["borderWidth"] = ledBorder + "px";
      // set to be round or circular
      if (squareLed) {
        // make sizes similar to size in CS-Studio, five taken
        // away from default in css file too
        style.width = `${bitWidth}px`;
        // If height not specified, use width
        style.height = height ? `${height - 5}px` : style.width;
      } else {
        // If circular led, width and height are the same
        // make sizes similar to size in CS-Studio, five taken
        // away from default in css file too
        style.width = `${bitWidth}px`;
        style.height = style.width;
        style["borderRadius"] = "50%";
      }
      const className = classes.Bit;
      const bitDiv = (
        <div key={`bit${i}`} className={className} style={style} />
      );
      bitArray.push(bitDiv);
    }
  }
  return <div className={"ByteMonitor"}>{bitArray}</div>;
};

const ByteMonitorWidgetProps = {
  ...ByteMonitorProps,
  ...PVWidgetPropType
};

export const ByteMonitor = (
  props: InferWidgetProps<typeof ByteMonitorWidgetProps>
): JSX.Element => <Widget baseWidget={ByteMonitorComponent} {...props} />;

registerWidget(ByteMonitor, ByteMonitorWidgetProps, "byteMonitor");
