import React, { useState } from "react";
import log from "loglevel";

import classes from "./slideControl.module.css";

import {
  ProgressBarComponent,
  ProgressBarProps
} from "../ProgressBar/progressBar";
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
  transparent: BoolPropOpt
};

export const SlideControlComponent = (
  props: InferWidgetProps<typeof SliderControlProps> & PVInputComponent
): JSX.Element => {
  const {
    pvName,
    connected,
    value,
    horizontal = true,
    limitsFromPv = false,
    foregroundColor = diamondTheme.palette.primary.contrastText,
    backgroundColor = diamondTheme.palette.primary.main,
    /* TODO: Implement vertical style and allow absolute positioning */
    //vertical = false,
    precision = undefined
  } = props;
  let { min = 0, max = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }

  const [inputValue, setInputValue] = useState<number>(0);
  const [editing, setEditing] = useState(false);

  function onMouseDown(event: React.MouseEvent<HTMLInputElement>): void {
    setEditing(true);
  }
  function onMouseUp(value: number): void {
    setEditing(false);
    // try {
    //   const doubleValue = parseFloat(event.currentTarget.value);
    //   writePv(pvName, new DType({ doubleValue: doubleValue }));
    // } catch (error) {
    //   log.warn(`Unexpected value ${event.currentTarget.value} set to slider.`);
    // }
  }

  // const stringValue = DType.coerceString(value);
  // if (!editing && inputValue !== stringValue) {
  //   setInputValue(stringValue);
  // }

  return (
    <Slider
      value={inputValue}
      orientation={horizontal ? "horizontal" : "vertical"}
      onChange={(_, newValue) => setInputValue(newValue as number)}
      onChangeCommitted={(_, newValue) => onMouseUp(newValue as number)}
      valueLabelDisplay="auto"
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
          color: foregroundColor.toString(),
          backgroundColor: backgroundColor.toString(),
          opacity: 0.6,
          borderRadius: "4px",
          borderColor: foregroundColor.toString()
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
