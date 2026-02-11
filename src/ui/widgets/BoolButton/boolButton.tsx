import React, { useEffect, useState } from "react";
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
  FontPropOpt,
  ChoicePropOpt
} from "../propTypes";
import { ColorUtils } from "../../../types/color";
import { writePv } from "../../hooks/useSubscription";
import { dTypeGetDoubleValue, newDType } from "../../../types/dtypes";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { Button as MuiButton, styled, useTheme } from "@mui/material";
import { getPvValueAndName } from "../utils";
import { LedComponent } from "../LED/led";
import { fontToCss } from "../../../types/font";

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
  font: FontPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"]),
  textAlignV: ChoicePropOpt(["top", "center", "bottom"])
};

const Button = styled(MuiButton)({
  "&.MuiButton-root": {
    display: "flex",
    lineHeight: 1.3,
    height: "100%",
    width: "100%",
    minWidth: 0,
    minHeight: 0,
    padding: 0,
    overflow: "hidden",
    whiteSpace: "wrap",
    wordBreak: "break-word",
    textTransform: "none"
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  },
  "& .MuiButton-startIcon": {
    margin: "0px",
    marginRight: "2px"
  }
});

export type BoolButtonComponentProps = InferWidgetProps<
  typeof BoolButtonProps
> &
  PVComponent;

/**
 * Button that displays boolean value, and changes when clicked.
 * @param props
 */
export const BoolButtonComponent = (
  props: BoolButtonComponentProps
): JSX.Element => {
  const theme = useTheme();
  const {
    width = WIDGET_DEFAULT_SIZES["bool_button"][0],
    height = WIDGET_DEFAULT_SIZES["bool_button"][1],
    pvData,
    onState = 1,
    offState = 0,
    onColor = ColorUtils.fromRgba(0, 255, 0),
    offColor = ColorUtils.fromRgba(0, 100, 0),
    showBooleanLabel = true,
    showLed = true,
    labelsFromPv = false,
    enabled = true,
    textAlign = "center",
    textAlignV = "center"
  } = props;
  const { value, effectivePvName: pvName } = getPvValueAndName(pvData);

  const foregroundColor =
    props.foregroundColor?.colorString ?? theme.palette.primary.contrastText;
  const backgroundColor =
    props.backgroundColor?.colorString ?? theme.palette.primary.main;

  const font = fontToCss(props.font) ?? theme.typography;

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
  const doubleValue = dTypeGetDoubleValue(value);
  const [ledColor, setLedColor] = useState(offColor.colorString);

  // Establish LED style
  const ledDiameter = showLed ? getDimensions(width, height) : 0;

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (doubleValue === onState) {
      if (showBooleanLabel) setLabel(onLabel);
      setLedColor(onColor.colorString);
    } else if (doubleValue === offState) {
      if (showBooleanLabel) setLabel(offLabel);
      setLedColor(offColor.colorString);
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
    // Write to PV
    if (pvName) {
      writePv(
        pvName,
        newDType({
          doubleValue: doubleValue === offState ? onState : offState
        })
      );
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
          color: foregroundColor,
          // If no LED, use on/off colours as background
          backgroundColor: showLed ? backgroundColor : ledColor,
          "&.MuiButton-root": {
            alignItems:
              textAlignV === "top"
                ? "flex-start"
                : textAlignV === "bottom"
                  ? "flex-end"
                  : "",
            justifyContent: textAlign
          }
        }}
        startIcon={
          showLed ? (
            <LedComponent
              pvData={pvData}
              onColor={onColor}
              offColor={offColor}
              width={ledDiameter}
              height={ledDiameter}
            />
          ) : (
            <></>
          )
        }
      >
        {label}
      </Button>
    </>
  );
};

/**
 * Calculate dimensions of the LED
 * @param width button width in px
 * @param height button height in px
 * @returns number diameter
 */
export function getDimensions(width: number, height: number): number {
  // This is the same sizing as in Phoebus
  const size = Math.min(width, height);
  const ledRadius = size / 3.7;
  const ledDiameter = Math.round(ledRadius * 2);

  return ledDiameter;
}

const BoolButtonWidgetProps = {
  ...BoolButtonProps,
  ...PVWidgetPropType
};

export const BoolButton = (
  props: InferWidgetProps<typeof BoolButtonWidgetProps>
): JSX.Element => <Widget baseWidget={BoolButtonComponent} {...props} />;

registerWidget(BoolButton, BoolButtonWidgetProps, "boolbutton");
