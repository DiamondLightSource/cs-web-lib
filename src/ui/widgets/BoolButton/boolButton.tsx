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
import { newColor } from "../../../types/color";
import { writePv } from "../../hooks/useSubscription";
import { dTypeGetDoubleValue, newDType } from "../../../types/dtypes";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { Button as MuiButton, styled } from "@mui/material";
import { getPvValueAndName } from "../utils";
import { LedComponent } from "../LED/led";
import { useStyle } from "../../hooks/useStyle";
import { useMeasuredSize } from "../../hooks/useMeasuredSize";

const widgetName = "boolbutton";

const BoolButtonProps = {
  pvName: StringPropOpt,
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
  const style = useStyle(
    {
      ...props,
      customColors: { onColor: props?.onColor, offColor: props?.offColor }
    },
    widgetName
  );

  const {
    pvData,
    onState = 1,
    offState = 0,
    showBooleanLabel = true,
    showLed = true,
    labelsFromPv = false,
    enabled = true,
    textAlign = "center",
    textAlignV = "center"
  } = props;
  const {
    value,
    effectivePvName: pvName,
    readOnly
  } = getPvValueAndName(pvData);

  const [ref, size] = useMeasuredSize<HTMLDivElement>(
    WIDGET_DEFAULT_SIZES["bool_button"][0],
    WIDGET_DEFAULT_SIZES["bool_button"][1]
  );

  // These could be overwritten by  PV labels
  let { onLabel = "On", offLabel = "Off" } = props;

  // Use labels from PV
  if (labelsFromPv) {
    const choices = value?.display.choices;
    if (choices && choices?.length === 2) {
      // If enum has 2 options use enum, otherwise use labels
      offLabel = choices[0];
      onLabel = choices[1];
    }
  }

  // Use useState for properties that change on click - text and color
  const [label, setLabel] = useState(showBooleanLabel ? offLabel : "");
  const doubleValue = dTypeGetDoubleValue(value);
  const [ledColor, setLedColor] = useState(style?.customColors?.offColor);

  // Establish LED style
  const ledDiameter = showLed ? getDimensions(size.width, size.height) : 0;

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (doubleValue === onState) {
      if (showBooleanLabel) setLabel(onLabel);
      setLedColor(style?.customColors?.onColor);
    } else if (doubleValue === offState) {
      if (showBooleanLabel) setLabel(offLabel);
      setLedColor(style?.customColors?.offColor);
    }
  }, [
    doubleValue,
    onState,
    onLabel,
    style?.customColors?.offColor,
    style?.customColors?.onColor,
    offState,
    offLabel,
    showBooleanLabel
  ]);

  function handleClick() {
    // Write to PV
    if (pvName && !readOnly) {
      writePv(
        pvName,
        newDType({
          doubleValue: doubleValue === offState ? onState : offState
        })
      );
    }
  }

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      <Button
        variant="contained"
        onClick={handleClick}
        disabled={readOnly || !enabled}
        sx={{
          cursor: readOnly ? "not-allowed" : "default",
          ...style.colors,
          ...style.font,
          // If no LED, use on/off colours as background
          backgroundColor: showLed ? style?.colors?.backgroundColor : ledColor,
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
            <div
              style={{ width: `${ledDiameter}px`, height: `${ledDiameter}px` }}
            >
              <LedComponent
                pvData={pvData}
                onColor={newColor(style?.customColors?.onColor)}
                offColor={newColor(style?.customColors?.offColor)}
              />
            </div>
          ) : (
            <></>
          )
        }
      >
        {label}
      </Button>
    </div>
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

registerWidget(BoolButton, BoolButtonWidgetProps, widgetName);
