import React, { useEffect, useState } from "react";
import log from "loglevel";

import { writePv } from "../../hooks/useSubscription";
import { Widget } from "../widget";
import { PVInputComponent, PVWidgetPropType } from "../widgetProps";
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
import { DType } from "../../../types/dtypes";
import { Slider } from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";

export const SliderControlProps = {
  min: FloatPropOpt,
  max: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  logScale: BoolPropOpt,
  horizontal: BoolPropOpt,
  showLabel: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  precision: IntPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt,
  enabled: BoolPropOpt,
  transparent: BoolPropOpt,
  levelHihi: FloatPropOpt,
  levelHigh: FloatPropOpt,
  levelLow: FloatPropOpt,
  levelLolo: FloatPropOpt,
  showHihi: BoolPropOpt,
  showHigh: BoolPropOpt,
  showLow: BoolPropOpt,
  showLolo: BoolPropOpt,
  increment: FloatPropOpt
};

export const SlideControlComponent = (
  props: InferWidgetProps<typeof SliderControlProps> & PVInputComponent
): JSX.Element => {
  const {
    pvName,
    connected,
    value = null,
    enabled = true,
    horizontal = true,
    limitsFromPv = false,
    foregroundColor = diamondTheme.palette.primary.contrastText,
    backgroundColor = diamondTheme.palette.primary.main,
    levelHihi = 90,
    levelHigh = 80,
    levelLow = 20,
    levelLolo = 10,
    showHihi = true,
    showHigh = true,
    showLow = true,
    showLolo = true,
    increment = 1
  } = props;
  let { min = 0, max = 100 } = props;

  const disabled = !connected || value === null ? true : !enabled;
  const font = props.font?.css() ?? diamondTheme.typography;

  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }

  const [inputValue, setInputValue] = useState<number>(
    value?.getDoubleValue() ?? 0
  );

  useEffect(() => {
    if (value) {
      setInputValue(value?.getDoubleValue() ?? 0);
    }
  }, [value]);

  function onMouseUp(value: number): void {
    try {
      writePv(pvName, new DType({ doubleValue: value }));
    } catch (error) {
      log.warn(`Unexpected value ${value} set to slider.`);
    }
  }

  const marks = [
    ...(showHihi
      ? [
          {
            value: levelHihi,
            label: levelHihi.toString()
          }
        ]
      : []),
    ...(showHigh
      ? [
          {
            value: levelHigh,
            label: levelHigh.toString()
          }
        ]
      : []),
    ...(showLow
      ? [
          {
            value: levelLow,
            label: levelLow.toString()
          }
        ]
      : []),
    ...(showLolo
      ? [
          {
            value: levelLolo,
            label: levelLolo.toString()
          }
        ]
      : [])
  ];

  return (
    <Slider
      value={inputValue}
      disabled={disabled}
      orientation={horizontal ? "horizontal" : "vertical"}
      onChange={(_, newValue) => setInputValue(newValue as number)}
      onChangeCommitted={(_, newValue) => onMouseUp(newValue as number)}
      valueLabelDisplay="auto"
      min={min}
      max={max}
      marks={marks}
      step={increment}
      sx={{
        color: backgroundColor.toString(),
        "& .MuiSlider-thumb": {
          height: 24,
          width: 24,
          backgroundColor: foregroundColor.toString(),
          border: "2px solid currentColor",
          "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
            boxShadow: "inherit"
          }
        },
        "& .MuiSlider-valueLabelOpen": {
          fontFamily: font,
          color: foregroundColor.toString(),
          backgroundColor: backgroundColor.toString(),
          opacity: 0.6,
          borderRadius: "4px",
          borderColor: foregroundColor.toString()
        },
        "& .MuiSlider-markLabel": {
          fontFamily: font,
          color: foregroundColor.toString()
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
