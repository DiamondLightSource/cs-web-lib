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

const LED_POSITION = 4.8 / 6;

const BoolButtonProps = {
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
  confirmMessage: StringPropOpt
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
    value,
    width = 100,
    height = 50,
    onState,
    offState,
    onColor = Color.fromRgba(0, 255, 0),
    offColor = Color.fromRgba(0, 100, 0),
    onLabel = "ON",
    offLabel = "OFF",
    squareButton = false,
    backgroundColor = Color.fromRgba(200, 200, 200),
    foregroundColor = Color.fromRgba(0, 0, 0),
    showBooleanLabel = true,
    showLed = false
  } = props;

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

  // Configure LED settings
  let ledDiameter = (0.25 * (width + height)) / 2;
  if (ledDiameter > Math.min(width, height))
    ledDiameter = Math.min(width, height) - 8;
  let ledX = 0;
  let ledY = 0;
  if (width >= height) {
    ledX = width * LED_POSITION - ledDiameter / 2;
    ledY = height / 2 - ledDiameter / 2;
  } else {
    ledX = width / 2 - ledDiameter / 2;
    ledY = height * (1 - LED_POSITION) - ledDiameter / 2;
  }
  const ledStyle: CSSProperties = {
    width: (0.25 * (width + height)) / 2,
    height: (0.25 * (width + height)) / 2,
    backgroundColor: ledColor,
    top: ledY,
    left: ledX,
    boxShadow: `inset ${ledDiameter / 4}px ${ledDiameter / 4}px ${
      ledDiameter * 0.4
    }px rgba(255,255,255,.5)`,
    visibility: "hidden"
  };
  // Hide LED if it isn't visible
  if (showLed) {
    // Shift text to the side for LED
    if (width > height) style["paddingRight"] = ledDiameter;
    ledStyle["visibility"] = "visible";
  }

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (doubleValue !== undefined && showBooleanLabel) {
      if (doubleValue === onState) {
        setLabel(onLabel);
        setLedColor(onColor.toString());
      } else if (doubleValue === offState) {
        setLabel(offLabel);
        setLedColor(offColor.toString());
      }
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

  // TO DO - currently we check existing value and change label. When
  // we have PV write ability, change value and label
  // TO DO - extra features such as confirmation modal?...
  function handleClick(e: React.MouseEvent) {
    // Remove span element to get just text
    const text = (e.target as HTMLButtonElement).innerHTML.split("<")[0];
    // Fetch RGB colour from background-color property
    const colorProp = (e.target as HTMLButtonElement).innerHTML
      .split("; ")[2] // Remove "background-color"
      .split("rgb(")[1] // Remove "rgb(""
      .slice(0, -1) // Remove final bracket
      .replace(/\s/g, ""); // Remove whitespace
    const color = "rgba(" + colorProp + ",255)";
    // If no label, we use led color as our parameter
    const param = showBooleanLabel ? text : color;
    const onParam = showBooleanLabel ? onLabel : onColor.toString();
    const offParam = showBooleanLabel ? offLabel : offColor.toString();
    if (param === onParam) {
      setLabel(offLabel);
      setLedColor(offColor.toString());
    } else if (param === offParam) {
      setLabel(onLabel);
      setLedColor(onColor.toString());
    }
  }

  return (
    <>
      <button
        className={classes.BoolButton}
        style={style}
        onClick={event => handleClick(event)}
      >
        {label}
        <span className={classes.Led} style={ledStyle} />
      </button>
    </>
  );
};

const BoolButtonWidgetProps = {
  ...BoolButtonProps,
  ...PVWidgetPropType
};

export const BoolButton = (
  props: InferWidgetProps<typeof BoolButtonWidgetProps>
): JSX.Element => <Widget baseWidget={BoolButtonComponent} {...props} />;

registerWidget(BoolButton, BoolButtonWidgetProps, "boolbutton");
