import React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Box } from "@mui/material";
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
import { Color } from "../../../types/color";
import { XAxis, YAxis } from "@mui/x-charts";
import { getPvValueAndName } from "../utils";

export const TankProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  logScale: BoolPropOpt,
  horizontal: BoolPropOpt,
  showLabel: BoolPropOpt,
  emptyColor: ColorPropOpt,
  fillColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  precision: IntPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  transparent: BoolPropOpt,
  scaleVisible: BoolPropOpt,
  showUnits: BoolPropOpt
};

export const TankComponent = (
  props: InferWidgetProps<typeof TankProps> & PVComponent
): JSX.Element => {
  const {
    pvData,
    limitsFromPv = false,
    showLabel = false,
    font,
    horizontal = false,
    fillColor = Color.fromRgba(0, 0, 255, 1),
    emptyColor = Color.fromRgba(192, 192, 192, 1),
    precision = undefined,
    scaleVisible = true,
    logScale = false,
    showUnits = true,
    transparent = false // This property only exists in CSStudio, so default to false
  } = props;

  const { value, pvName } = getPvValueAndName(pvData);

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? "rgba(250, 250, 250, 1)");

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    minimum = value.display.controlRange?.min;
    maximum = value.display.controlRange?.max;
  }

  const units = value?.display.units ?? "";
  const numValue = value?.getDoubleValue() ?? 0;

  // Show a warning if min is bigger than max and apply precision if provided
  let label = "";
  if (showLabel) {
    if (minimum > maximum) {
      label = "Check min and max values";
    } else {
      if (precision) {
        label = numValue.toFixed(precision === -1 ? 3 : precision);
      } else {
        label = numValue.toString();
      }
    }
  }

  let scalePosition = "none";
  if (scaleVisible) {
    scalePosition = horizontal ? "top" : "left";
  }

  const scaleAxisProps = {
    min: minimum,
    max: maximum,
    data: scaleVisible ? undefined : [""],
    position: scalePosition,
    scaleType: logScale ? "symlog" : "linear"
  };

  const disabledAxisProps = [
    {
      data: [""],
      position: "none",
      categoryGapRatio: 0,
      barGapRatio: 0,
      hideTooltip: true
    }
  ];

  return (
    <Box>
      <BarChart
        skipAnimation
        borderRadius={4}
        hideLegend
        margin={{
          left: horizontal ? 10 : 2,
          right: horizontal ? 10 : 2,
          top: horizontal ? 2 : 10,
          bottom: horizontal ? 2 : 10
        }}
        layout={horizontal ? "horizontal" : "vertical"}
        xAxis={
          horizontal
            ? ([{ ...scaleAxisProps, height: 25 }] as ReadonlyArray<XAxis<any>>)
            : (disabledAxisProps as ReadonlyArray<XAxis<any>>)
        }
        yAxis={
          horizontal
            ? (disabledAxisProps as ReadonlyArray<YAxis<any>>)
            : ([{ ...scaleAxisProps, width: 25 }] as ReadonlyArray<YAxis<any>>)
        }
        series={[
          {
            data: [numValue],
            stack: "total",
            color: fillColor.toString(),
            label: pvName?.toString(),
            type: "bar",
            valueFormatter: val => {
              return showUnits && units && val
                ? `${val} ${units}`
                : `${val ?? ""}`;
            }
          },
          {
            // This is the empty part of the tank
            data: [maximum - numValue],
            stack: "total",
            color: emptyColor.toString(),
            type: "bar",
            label: undefined,
            // Disable tooltip for this series
            valueFormatter: () => null
          }
        ]}
        sx={{
          height: "100%",
          width: "100%",
          position: "absolute",
          border: 1,
          borderColor: "#D2D2D2",
          borderRadius: "4px",
          backgroundColor: backgroundColor.toString()
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          color: "#000000",
          alignContent: "center",
          ...font?.css()
        }}
      >
        {label}
      </div>
    </Box>
  );
};

const TankWidgetProps = {
  ...TankProps,
  ...PVWidgetPropType
};

export const Tank = (
  props: InferWidgetProps<typeof TankWidgetProps>
): JSX.Element => <Widget baseWidget={TankComponent} {...props} />;

registerWidget(Tank, TankWidgetProps, "tank");
