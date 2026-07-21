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
import { getPvValueAndName } from "../utils";
import { dTypeGetDoubleValue } from "../../../types/dtypes";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "progressbar";

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
  transparent: BoolPropOpt,
  visible: BoolPropOpt
};

type ProgressBarComponentProps = InferWidgetProps<typeof ProgressBarProps> &
  PVComponent;

export const ProgressBarComponent = (
  props: ProgressBarComponentProps
): JSX.Element => {
  const [style, newProps] = useStyle(
    { ...props, customColors: { fillColor: props?.fillColor } },
    widgetName,
    props.class
  );
  const {
    pvData,
    limitsFromPv = false,
    showLabel = false,
    horizontal = true,
    precision = undefined,
    logScale = false,
    visible = true
  } = newProps as ProgressBarComponentProps;

  const { value } = getPvValueAndName(pvData);

  let { min = 0, max = 100 } = newProps as ProgressBarComponentProps;
  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }
  const numValue = dTypeGetDoubleValue(value) ?? 0;
  const percentCalc = logScale
    ? ((Math.log10(numValue) - Math.log10(min)) * 100) /
      (Math.log10(max) - Math.log10(min))
    : ((numValue - min) * 100) / (max - min);

  const percent = numValue < min ? 0 : numValue > max ? 100 : percentCalc;

  // Show a warning if min is bigger than max and apply precision if provided
  let label = "";
  if (showLabel) {
    if (min > max) {
      label = "Check min and max values";
    } else {
      if (precision) {
        label = numValue.toFixed(precision === -1 ? 3 : precision);
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
          height: "100%",
          width: "100%",
          visibility: visible ? "visible" : "hidden",
          border: 1,
          borderColor: "#D2D2D2",
          borderRadius: "4px",
          backgroundColor: style?.colors?.backgroundColor,
          "& .MuiLinearProgress-bar": {
            transform: horizontal
              ? null
              : `translateY(${100 - percent}%)!important`.toString(),
            backgroundColor: style?.customColors?.fillColor
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
          ...style?.font
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

registerWidget(ProgressBar, ProgressBarWidgetProps, widgetName);
