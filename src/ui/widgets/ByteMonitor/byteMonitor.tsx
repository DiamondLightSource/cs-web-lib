import React, { CSSProperties } from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  BoolPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import classes from "./byteMonitor.module.css";
import { Color } from "../../../types/color";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { getPvValueAndName } from "../utils";
import { dTypeGetDoubleValue } from "../../../types/dtypes/dType";

export const ByteMonitorProps = {
  width: IntPropOpt,
  height: IntPropOpt,
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  numBits: IntPropOpt,
  startBit: IntPropOpt,
  horizontal: BoolPropOpt,
  bitReverse: BoolPropOpt,
  square: BoolPropOpt,
  ledBorder: IntPropOpt,
  ledBorderColor: ColorPropOpt,
  effect3d: BoolPropOpt
};

export type ByteMonitorComponentProps = InferWidgetProps<
  typeof ByteMonitorProps
> &
  PVComponent;

/**
 * @param props properties to pass in, these will be handled by the below BYteMonitor
 * function and only extra props defined on ByteMonitorProps need to be passed in as well
 * Currently discarding props ledPacked and labels, because they don't seem to be useful
 */
export const ByteMonitorComponent = (
  props: ByteMonitorComponentProps
): JSX.Element => {
  const {
    pvData,
    startBit = 0,
    horizontal = true,
    bitReverse = false,
    onColor = Color.fromRgba(0, 255, 0),
    offColor = Color.fromRgba(0, 100, 0),
    ledBorder = 2,
    ledBorderColor = Color.fromRgba(50, 50, 50, 178), // dark grey
    square = false,
    effect3d = false,
    width = WIDGET_DEFAULT_SIZES["byte_monitor"][0],
    height = WIDGET_DEFAULT_SIZES["byte_monitor"][1]
  } = props;
  const { value } = getPvValueAndName(pvData);

  // Check for a value, otherwise set to 0
  const doubleValue = dTypeGetDoubleValue(value) || 0;
  // Check numBits isn't out of bounds
  let numBits = props.numBits || 8;
  if (numBits < 1) numBits = 1;
  if (numBits > 64) numBits = 64;

  const dataValues = getBytes(doubleValue, numBits, startBit, bitReverse);
  // If 3D effect, there is no border but we must leave space for shadow
  const border = effect3d ? 2 : ledBorder;
  const [bitWidth, bitHeight, borderWidth] = recalculateDimensions(
    numBits,
    width,
    height,
    border,
    horizontal,
    square
  );
  const ledArray: Array<JSX.Element> = [];
  dataValues.forEach((data: number, idx: number) => {
    const style: CSSProperties = {};
    // Set CSS formatting if vertically or horizontally aligned
    if (horizontal) {
      style.display = "inline-block";
      style["flexFlow"] = "row wrap";
      style["marginRight"] = `-${borderWidth}px`;
    } else {
      style["marginBottom"] = `-${borderWidth}px`;
    }
    // Set color based on bit
    style["backgroundColor"] = data
      ? onColor?.toString()
      : offColor?.toString();
    // Set border color and thickness
    style["borderColor"] = ledBorderColor.toString();
    style["borderWidth"] = `${borderWidth}px`;
    // Set shape as square or circular
    if (square) {
      style.width = `${bitWidth + borderWidth}px`;
      style.height = `${bitHeight + borderWidth}px`;
    } else {
      // If 3d, border width is slightly narrower
      // If circular led, width and height are the same
      style.width = horizontal
        ? `${bitWidth + borderWidth}px`
        : `${bitHeight + borderWidth}px`;
      style.height = style.width;
      style["borderRadius"] = "50%";
    }
    // Add 3D effect
    if (effect3d) {
      // For ellipse, border is different in 3D. For square it is the same
      // but the LED has a shadow
      style["backgroundImage"] = `radial-gradient(circle at top left, white, ${
        data ? onColor?.toString() : offColor?.toString()
      })`;
      if (!square) {
        style["borderColor"] = "transparent";
        style["backgroundImage"] +=
          ", radial-gradient(circle at top left, black,white)";
        style["backgroundOrigin"] = "border-box";
        style["backgroundClip"] = "padding-box, border-box";
      }
    }
    const className = classes.Bit;
    const bitDiv = (
      <div key={`bit${idx}`} className={className} style={style} />
    );

    ledArray.push(bitDiv);
  });

  return (
    <div
      className={classes.ByteMonitor}
      style={{ height: "100%", width: "100%" }}
    >
      {ledArray}
    </div>
  );
};

/**
 * Recalculate size of led and border if necessary to
 * ensure it fits within width/height boundaries if possible
 * @param numBits number of LEDs to display
 * @param width width of bytemonitor
 * @param height height of bytemonitor
 * @param ledBorder thickness of border around each led
 * @param horizontal whether displayed horizontal or vertical
 * @returns array of bit width, height and border thickness
 */
export function recalculateDimensions(
  numBits: number,
  width: number,
  height: number,
  ledBorder: number,
  horizontal: boolean,
  squareLed: boolean
): number[] {
  width = width - 2;
  height = height - 2;
  // If horizontal, width is the value we split bits along
  const size = horizontal ? width : height;
  // Calculate how wide led can be if we use existing bit Size
  let bitSize = size / numBits;
  // If bitSize < 1 only show border not led
  if (!squareLed) {
    // Check that bitSize fits in other axis if circular led
    const otherDimension = horizontal ? height : width;
    // If bigger, we must use other dimension
    if (bitSize > otherDimension) bitSize = otherDimension;
  }
  if (bitSize < 1) {
    const val = size / (numBits - 1);
    if (val < 1) {
      // If less than zero it means there's so many bits
      // we can't fit them all in display even without border
      // so we set both to zero and display nothing
      ledBorder = 0;
      bitSize = 0;
    } else {
      // If greater than 1 we can set border to some value
      ledBorder = Math.round(size / (numBits - 1));
    }
  }
  return [
    horizontal ? bitSize : width,
    horizontal ? height : bitSize,
    ledBorder
  ];
}

/**
 * Convert integer into bytes to display as LEDs
 * @param num
 * @returns
 */
export function getBytes(
  num: number,
  numBits: number,
  startBit: number,
  bitReverse: boolean
): number[] {
  if (numBits + startBit > 32) numBits = 32 - startBit;
  const bitArray: number[] = [];
  // Mimic Java's Integer.toUnsignedLong method
  if (num < 0) num = 4294967296 + num;
  for (let i = 0; i < numBits; i++) {
    // Determine whether each bit is 0 or 1
    // This is done identically to how it is in Phoebus
    bitArray[bitReverse ? i : numBits - 1 - i] =
      (num & (1 << (startBit + i))) === 0 ? 0 : 1;
  }
  return bitArray;
}

const ByteMonitorWidgetProps = {
  ...ByteMonitorProps,
  ...PVWidgetPropType
};

export const ByteMonitor = (
  props: InferWidgetProps<typeof ByteMonitorWidgetProps>
): JSX.Element => <Widget baseWidget={ByteMonitorComponent} {...props} />;

registerWidget(ByteMonitor, ByteMonitorWidgetProps, "bytemonitor");
