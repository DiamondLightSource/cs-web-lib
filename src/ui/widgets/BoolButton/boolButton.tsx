import React, { useEffect, useState, CSSProperties } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  PointsPropOpt,
  BoolPropOpt,
  StringPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import classes from "./boolButton.module.css";
import { writePv } from "../../hooks/useSubscription";
import { DType } from "../../../types/dtypes";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

const LED_POSITION = 4.8 / 6;

const BoolButtonProps = {
  pvName: StringPropOpt,
  height: IntPropOpt,
  width: IntPropOpt,
  onState: IntPropOpt,
  offState: IntPropOpt,
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  onLabel: StringPropOpt,
  offLabel: StringPropOpt,
  squareButton: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  points: PointsPropOpt,
  rotationAngle: IntPropOpt,
  effect3d: BoolPropOpt,
  showBooleanLabel: BoolPropOpt,
  showLed: BoolPropOpt,
  confirmMessage: StringPropOpt,
  labelsFromPv: BoolPropOpt
};

export type BoolButtonComponentProps = InferWidgetProps<
  typeof BoolButtonProps
> &
  PVComponent;

/**
 * Button that displays boolean value, and changes when clicked.
 * Currently no write to PV so value does not change, only button
 * appearance does
 * @param props
 */
export const BoolButtonComponent = (
  props: BoolButtonComponentProps
): JSX.Element => {
  const {
    width = WIDGET_DEFAULT_SIZES["bool_button"][0],
    height = WIDGET_DEFAULT_SIZES["bool_button"][1],
    pvName,
    value,
    onState = 1,
    offState = 0,
    onColor = Color.fromRgba(0, 255, 0),
    offColor = Color.fromRgba(0, 100, 0),
    squareButton = true,
    backgroundColor = Color.fromRgba(200, 200, 200),
    foregroundColor = Color.fromRgba(0, 0, 0),
    showBooleanLabel = true,
    showLed = true,
    labelsFromPv = false
  } = props;

  // These could be overwritten by  PV labels
  let {
    onLabel = "ON",
    offLabel = "OFF"
  } = props;

  // Use labels from PV
  if (labelsFromPv) {
    if (value?.display.choices) {
      offLabel = value.display.choices[0]
      onLabel = value.display.choices[1]
    }
  }

  // Use useState for properties that change on click - text and color
  const [label, setLabel] = useState(showBooleanLabel ? offLabel : "");
  const [ledColor, setLedColor] = useState(offColor.toString());
  const doubleValue = value?.getDoubleValue();

  // Establish style
  const style: CSSProperties = {
    width: width,
    height: height,
    backgroundColor: backgroundColor.toString(),
    color: foregroundColor.toString()
  };
  if (!squareButton) style["borderRadius"] = "50%";
  // Establish LED style
  const [ledStyle, ledDiameter] = createLed(width, height, ledColor);
  // Hide LED if it isn't visible
  if (showLed) {
    if (width > height) style["paddingLeft"] = ledDiameter;
    ledStyle["visibility"] = "visible";
  }

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (doubleValue === onState) {
      if (showBooleanLabel) setLabel(onLabel);
      setLedColor(onColor.toString());
    } else if (doubleValue === offState) {
      if (showBooleanLabel) setLabel(offLabel);
      setLedColor(offColor.toString());
    }
  }, [
    doubleValue,
    onState,
    onLabel,
    onColor,
    offState,
    offLabel,
    offColor,
    showBooleanLabel
  ]);

  function handleClick() {
    // Update button
    if (doubleValue === onState) {
      if (showBooleanLabel) setLabel(offLabel);
      setLedColor(offColor.toString());
    } else if (doubleValue === offState) {
      if (showBooleanLabel) setLabel(onLabel);
      setLedColor(onColor.toString());
    }
    // Write to PV
    if (pvName) {
      let newValue = offState;
      if (doubleValue === offState) newValue = onState;
      writePv(pvName, new DType({ doubleValue: newValue }));
    }
  }

  return (
    <>
      <button
        className={classes.BoolButton}
        style={style}
        onClick={handleClick}
      >
        <span className={classes.Led} style={ledStyle} />
        {label}
      </button>
    </>
  );
};

/**
 * Create an LED to display on BoolButton
 * @param width button width in px
 * @param height button height in px
 * @param color color of led
 * @returns CSSProperties for led
 */
export function createLed(
  width: number,
  height: number,
  color: string
): [CSSProperties, number] {
  // This is done the same as in phoebus/csstudio
  let ledDiameter = (0.25 * (width + height)) / 2;
  if (ledDiameter > Math.min(width, height))
    ledDiameter = Math.min(width, height) - 8;
  const ledX = width / 2 - (ledDiameter + 2);
  let ledY = 0;
  if (width >= height) {
    ledY = height / 2 - ledDiameter / 2;
  } else {
    ledY = height * (1 - LED_POSITION) - ledDiameter / 2;
  }
  const ledStyle: CSSProperties = {
    width: (0.25 * (width + height)) / 2,
    height: (0.25 * (width + height)) / 2,
    backgroundColor: color,
    top: ledY,
    left: ledX,
    boxShadow: `inset ${ledDiameter / 4}px ${ledDiameter / 4}px ${ledDiameter * 0.4
      }px rgba(255,255,255,.5)`,
    visibility: "hidden"
  };

  return [ledStyle, ledDiameter];
}

const BoolButtonWidgetProps = {
  ...BoolButtonProps,
  ...PVWidgetPropType
};

export const BoolButton = (
  props: InferWidgetProps<typeof BoolButtonWidgetProps>
): JSX.Element => <Widget baseWidget={BoolButtonComponent} {...props} />;

registerWidget(BoolButton, BoolButtonWidgetProps, "boolbutton");
