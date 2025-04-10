import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  IntPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt,
  BorderPropOpt
} from "../propTypes";
import { LinearProgress } from "@mui/material";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

export const ProgressBarProps = {
  min: FloatPropOpt,
  max: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  logScale: BoolPropOpt,
  horizontal: BoolPropOpt,
  showLabel: BoolPropOpt,
  fillColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  precision: IntPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt
};

export const ProgressBarComponent = (
  props: InferWidgetProps<typeof ProgressBarProps> & PVComponent
): JSX.Element => {
  const {
    value,
    limitsFromPv = false,
    showLabel = false,
    font,
    horizontal = true,
    fillColor = "#3CFF3C",
    backgroundColor = "#FAFAFA",
    precision = undefined,
    logScale = false,
    width = WIDGET_DEFAULT_SIZES["progressbar"][0],
    height = WIDGET_DEFAULT_SIZES["progressbar"][1]
  } = props;

  let { min = 0, max = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }
  const numValue = value?.getDoubleValue() ?? 0;
  const percent = logScale
    ? ((Math.log10(numValue) - Math.log10(min)) * 100) /
      (Math.log10(max) - Math.log10(min))
    : ((numValue - min) * 100) / (max - min);

  // Show a warning if min is bigger than max and apply precision if provided
  let label = "";
  if (showLabel) {
    if (min > max) {
      label = "Check min and max values";
    } else {
      if (precision) {
        label = numValue.toFixed(precision);
      } else {
        label = numValue.toString();
      }
    }
  }

  return (
    <>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          position: "absolute",
          height: height,
          width: width,
          border: 1,
          borderColor: "#000000",
          borderRadius: "4px",
          backgroundColor: backgroundColor.toString(),
          "& .MuiLinearProgress-bar": {
            transform: horizontal
              ? null
              : `translateY(${100 - percent}%)!important`.toString(),
            backgroundColor: fillColor.toString()
          }
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          color: "#000000",
          alignContent: "center",
          transform: horizontal ? undefined : "rotate(-90deg)",
          ...font?.css()
        }}
      >
        {label}
      </div>
    </>
  );
};

const ProgressBarWidgetProps = {
  ...ProgressBarProps,
  ...PVWidgetPropType
};

export const ProgressBar = (
  props: InferWidgetProps<typeof ProgressBarWidgetProps>
): JSX.Element => <Widget baseWidget={ProgressBarComponent} {...props} />;

registerWidget(ProgressBar, ProgressBarWidgetProps, "progressbar");
