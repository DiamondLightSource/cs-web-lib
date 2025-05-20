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
  StringPropOpt,
  FontPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import classes from "./boolButton.module.css";
import { writePv } from "../../hooks/useSubscription";
import { DType } from "../../../types/dtypes";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { Button as MuiButton, styled, useTheme } from "@mui/material";

// For HTML button, these are the sizes of the buffer on
// width and height. Must take into account when allocating
// maximum size for text
const BUTTON_BUFFER = { width: 12, height: 6 };

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
  labelsFromPv: BoolPropOpt,
  enabled: BoolPropOpt,
  font: FontPropOpt
};

const Button = styled(MuiButton)({
  "&.MuiButton-root": {
    display: "block",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    minWidth: 0,
    minHeight: 0,
    padding: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    wordBreak: "break-word",
    textTransform: "none"
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  }
});

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
  const theme = useTheme();
  const {
    width = WIDGET_DEFAULT_SIZES["bool_button"][0],
    height = WIDGET_DEFAULT_SIZES["bool_button"][1],
    foregroundColor = theme.palette.primary.contrastText,
    backgroundColor = theme.palette.primary.main,
    pvName,
    value,
    onState = 1,
    offState = 0,
    onColor = Color.fromRgba(0, 255, 0),
    offColor = Color.fromRgba(0, 100, 0),
    squareButton = false,
    showBooleanLabel = true,
    showLed = true,
    labelsFromPv = false,
    enabled = true
  } = props;

  const font = props.font?.css() ?? theme.typography;

  // These could be overwritten by  PV labels
  let { onLabel = "On", offLabel = "Off" } = props;

  // Use labels from PV
  if (labelsFromPv) {
    if (value?.display.choices) {
      offLabel = value.display.choices[0];
      onLabel = value.display.choices[1];
    }
  }

  // Use useState for properties that change on click - text and color
  const [label, setLabel] = useState(showBooleanLabel ? offLabel : "");
  const [ledColor, setLedColor] = useState(offColor.toString());
  const doubleValue = value?.getDoubleValue();

  // Establish LED style
  const [ledStyle, ledDiameter] = showLed
    ? createLed(width, height, ledColor)
    : [{}, 0];
  if (squareButton) ledStyle["borderRadius"] = 0;

  const textStyle: CSSProperties = {
    // Ensure that text doesn't overflow from button
    maxWidth: width - ledDiameter - BUTTON_BUFFER.width,
    maxHeight: height - BUTTON_BUFFER.height
  };

  // Hide LED if it isn't visible
  if (showLed) ledStyle["visibility"] = "visible";

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
      <Button
        variant="contained"
        onClick={handleClick}
        disabled={!enabled}
        sx={{
          fontFamily: font,
          color: foregroundColor.toString(),
          // If no LED, use on/off colours as background
          backgroundColor: showLed ? backgroundColor.toString() : ledColor
        }}
      >
        <span
          className={classes.LedAndText}
          style={{
            width: width - BUTTON_BUFFER.width,
            height: height - BUTTON_BUFFER.height
          }}
        >
          <span className={classes.Led} style={ledStyle} />
          <span className={classes.Text} style={textStyle}>
            {label}
          </span>
        </span>
      </Button>
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
  // This is the same sizing as in Phoebus
  const size = Math.min(width, height);
  const ledRadius = size / 3.7;
  const ledDiameter = Math.round(ledRadius * 2);

  const ledStyle: CSSProperties = {
    width: ledDiameter,
    height: ledDiameter,
    backgroundColor: color,
    boxShadow: `inset ${ledDiameter / 4}px ${ledDiameter / 4}px ${
      ledDiameter * 0.4
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
