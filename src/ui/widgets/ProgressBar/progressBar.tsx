import React, { CSSProperties } from "react";

import classes from "./progressBar.module.css";
import { commonCss, Widget } from "../widget";
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
  border: BorderPropOpt
};

export const ProgressBarComponent = (
  props: InferWidgetProps<typeof ProgressBarProps> & PVComponent
): JSX.Element => {
  const style = commonCss(props);
  const {
    value,
    limitsFromPv = false,
    showLabel = false,
    font,
    horizontal = true,
    fillColor = "#3CFF3C",
    backgroundColor = "#FAFAFA",
    precision = undefined,
    logScale = false
  } = props;
  let { min = 0, max = 100 } = props;

  if (limitsFromPv && value?.display.controlRange) {
    min = value.display.controlRange?.min;
    max = value.display.controlRange?.max;
  }
  const numValue = value?.getDoubleValue() || 0;
  const progress = logScale
    ? (Math.log10(numValue) - Math.log10(min)) /
      (Math.log10(max) - Math.log10(min))
    : (numValue - min) / (max - min);

  // Store styles in these variables
  // Change the direction of the gradient depending on wehether the bar is vertical
  // const direction = horizontal ? "to top" : "to left";
  // let fillStyle: CSSProperties = {
  //   left: style.borderWidth,
  //   bottom: style.borderWidth,
  //   backgroundImage: `linear-gradient(${direction}, ${fillColor.toString()} 50%, #ffffff 130%)`
  // };
  // if (horizontal) {
  //   fillStyle = {
  //     ...fillStyle,
  //     height: "100%",
  //     top: style.borderWidth,
  //     width: `${onPercent}%`
  //   };
  // } else {
  //   fillStyle = {
  //     ...fillStyle,
  //     width: "100%",
  //     left: style.borderWidth,
  //     height: `${onPercent}%`
  //   };
  // }

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
    <LinearProgress
      variant="determinate"
      value={50}
      sx={{
        height: "100%",
        width: "100%",
        border: 1,
        borderColor: "#000000",
        borderRadius: "4px",
        backgroundColor: backgroundColor.toString(),
        "& .MuiLinearProgress-bar": {
          backgroundColor: fillColor.toString()
        }
      }}
    />
    // <div className={classes.bar} style={style}>
    //   <div className={classes.fill} style={fillStyle} />
    //   <div className={classes.label} style={{ ...font?.css() }}>
    //     {label}
    //   </div>
    // </div>
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
