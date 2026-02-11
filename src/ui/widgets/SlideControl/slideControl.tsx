import React, { useEffect, useState } from "react";
import log from "loglevel";

import { writePv } from "../../hooks/useSubscription";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import {
  BoolPropOpt,
  BorderPropOpt,
  ColorPropOpt,
  FloatPropOpt,
  FontPropOpt,
  InferWidgetProps,
  IntPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { dTypeGetDoubleValue, newDType } from "../../../types/dtypes";
import { Slider, useTheme } from "@mui/material";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { getPvValueAndName } from "../utils";
import { fontToCss } from "../../../types/font";

export const SliderControlProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  logScale: BoolPropOpt,
  horizontal: BoolPropOpt,
  showLabel: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  precision: IntPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  enabled: BoolPropOpt,
  transparent: BoolPropOpt,
  levelHihi: FloatPropOpt,
  levelHigh: FloatPropOpt,
  levelLow: FloatPropOpt,
  levelLolo: FloatPropOpt,
  showScale: BoolPropOpt,
  showHihi: BoolPropOpt,
  showHigh: BoolPropOpt,
  showLow: BoolPropOpt,
  showLolo: BoolPropOpt,
  increment: FloatPropOpt,
  majorTickStepHint: IntPropOpt,
  width: FloatPropOpt,
  height: FloatPropOpt
};

export const SlideControlComponent = (
  props: InferWidgetProps<typeof SliderControlProps> & PVComponent
): JSX.Element => {
  const theme = useTheme();
  const {
    pvData,
    enabled = true,
    horizontal = true,
    limitsFromPv = false,
    levelHihi = 90,
    levelHigh = 80,
    levelLow = 20,
    levelLolo = 10,
    showScale = true,
    showHihi = true,
    showHigh = true,
    showLow = true,
    showLolo = true,
    increment = 1,
    majorTickStepHint = 40,
    width = WIDGET_DEFAULT_SIZES["scaledslider"][0],
    height = WIDGET_DEFAULT_SIZES["scaledslider"][1]
  } = props;
  const foregroundColor =
    props.foregroundColor?.colorString ?? theme.palette.primary.contrastText;
  const backgroundColor =
    props.backgroundColor?.colorString ?? theme.palette.primary.main;

  let { minimum = 0, maximum = 100 } = props;
  const { value, effectivePvName: pvName } = getPvValueAndName(pvData);

  const font = fontToCss(props.font) ?? theme.typography;

  if (limitsFromPv && value?.display.controlRange) {
    minimum = value.display.controlRange?.min;
    maximum = value.display.controlRange?.max;
  }

  const range = maximum - minimum;
  let marks = [];
  let decimalPlaces = 0;
  let tickInterval;

  // Calculate number of ticks to show
  let numOfTicks = Math.round(
    (horizontal ? width : height) / majorTickStepHint
  );
  if (numOfTicks > 15) numOfTicks = 15; // Phoebus roughly has a maximum of 15 ticks
  // Check if the number of ticks makes equal markers, iterate until we find good value
  // If range is less than one, we will never have round numbers
  if (range > 1) {
    let tickRemainder = range % numOfTicks;
    while (tickRemainder !== 0) {
      numOfTicks--;
      tickRemainder = range % numOfTicks;
    }
    tickInterval = range / numOfTicks;
  } else {
    // Can't use remainder so round to 1 less decimal place than parent
    decimalPlaces = (range / 10).toString().split(".")[1].length;
    tickInterval = Number((range / numOfTicks).toFixed(decimalPlaces));
  }

  // Create marks
  if (showScale) {
    for (let i = minimum; i <= maximum; ) {
      marks.push({
        value: i,
        label: i.toFixed(decimalPlaces)
      });
      i = i + tickInterval;
      if (i > maximum) {
        marks.push({
          value: maximum,
          label: maximum.toFixed(decimalPlaces)
        });
      }
    }
  }

  const [inputValue, setInputValue] = useState<number>(
    dTypeGetDoubleValue(value) ?? 0
  );

  useEffect(() => {
    if (value) {
      setInputValue(dTypeGetDoubleValue(value) ?? 0);
    }
  }, [value]);

  function onMouseUp(value: number): void {
    if (pvName !== undefined) {
      try {
        writePv(pvName, newDType({ doubleValue: value }));
      } catch (error) {
        log.warn(`Unexpected value ${value} set to slider.`);
      }
    }
  }

  // Add HIGH, HIHI, LOW and LOLO markers
  marks = marks.concat([
    ...(showHihi
      ? [
          {
            value: levelHihi,
            label: `${showScale ? "\n" : ""}HIHI`
          }
        ]
      : []),
    ...(showHigh
      ? [
          {
            value: levelHigh,
            label: `${showScale ? "\n" : ""}HIGH`
          }
        ]
      : []),
    ...(showLow
      ? [
          {
            value: levelLow,
            label: `${showScale ? "\n" : ""}LOW`
          }
        ]
      : []),
    ...(showLolo
      ? [
          {
            value: levelLolo,
            label: `${showScale ? "\n" : ""}LOLO`
          }
        ]
      : [])
  ]);

  return (
    <Slider
      value={inputValue}
      disabled={!enabled}
      orientation={horizontal ? "horizontal" : "vertical"}
      onChange={(_, newValue) => setInputValue(newValue as number)}
      onChangeCommitted={(_, newValue) => onMouseUp(newValue as number)}
      valueLabelDisplay="auto"
      min={minimum}
      max={maximum}
      marks={marks}
      step={increment}
      sx={{
        color: foregroundColor,
        "& .MuiSlider-thumb": {
          height: 16,
          width: 16,
          backgroundColor: "white",
          border: "2px solid currentColor",
          "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
            boxShadow: "inherit"
          }
        },
        "& .MuiSlider-valueLabelOpen": {
          fontFamily: font,
          color: foregroundColor,
          backgroundColor: backgroundColor,
          opacity: 0.6
        },
        "& .MuiSlider-markLabel": {
          fontFamily: font,
          color: foregroundColor,
          whiteSpace: "pre"
        },
        "&.Mui-disabled": {
          cursor: "not-allowed",
          pointerEvents: "all !important"
        }
      }}
    />
  );
};

const SlideControlWidgetProps = {
  ...SliderControlProps,
  ...PVWidgetPropType
};

export const SlideControl = (
  props: InferWidgetProps<typeof SlideControlWidgetProps>
): JSX.Element => <Widget baseWidget={SlideControlComponent} {...props} />;

registerWidget(SlideControl, SlideControlWidgetProps, "slidecontrol");
