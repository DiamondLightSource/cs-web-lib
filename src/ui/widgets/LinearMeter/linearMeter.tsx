import React from "react";
import { BarChart, BarSeries } from "@mui/x-charts/BarChart";
import { Box, useTheme } from "@mui/material";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  FontPropOpt,
  BobColorsPropOpt,
  IntPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import {
  ChartsReferenceLine,
  chartsTooltipClasses,
  XAxis,
  YAxis
} from "@mui/x-charts";
import { getPvValueAndName } from "../utils";
import {
  convertInfAndNanToUndefined,
  formatValue
} from "../Meter/meterUtilities";
import {
  RectangleAreaHorizontal,
  RectangleAreaVertical
} from "./rectangleArea";
import {
  TrianglePointerHorizontal,
  TrianglePointerVertical
} from "./trianglePointer";
import { buildStatusRegions } from "./linearMeterUtilities";

export const LinearMeterComponentProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  format: IntPropOpt,
  limitsFromPv: BoolPropOpt,
  displayHorizontal: BoolPropOpt,
  font: FontPropOpt,
  scaleVisible: BoolPropOpt,
  showUnits: BoolPropOpt,
  showLimits: BoolPropOpt,
  levelHihi: FloatPropOpt,
  levelHigh: FloatPropOpt,
  levelLow: FloatPropOpt,
  levelLolo: FloatPropOpt,
  needleWidth: FloatPropOpt,
  knobSize: FloatPropOpt,
  colors: BobColorsPropOpt
};

export const LinearMeterComponent = (
  props: InferWidgetProps<typeof LinearMeterComponentProps> & PVComponent
): JSX.Element => {
  const theme = useTheme();
  const {
    pvData,
    limitsFromPv = true,
    levelHihi = 90,
    levelHigh = 80,
    levelLow = 20,
    levelLolo = 10,
    needleWidth = 1,
    knobSize = 8,
    font,
    displayHorizontal = true,
    scaleVisible = true,
    showUnits = true,
    showLimits = true,
    format = 1
  } = props;

  const {
    foregroundColor = theme.palette.primary.contrastText,
    needleColor = theme.palette.primary.contrastText,
    knobColor = theme.palette.primary.contrastText
  } = props?.colors ?? {};

  const { value, effectivePvName: pvName } = getPvValueAndName(pvData);
  const units = value?.display.units ?? "";
  const numValue = value?.getDoubleValue() ?? 0;

  const backgroundColor =
    props?.colors?.backgroundColor?.toString() ?? theme.palette.primary.main;

  // Set the maximum, minimum and alarm levels.
  let alarmRangeMin: number | undefined = levelLolo;
  let alarmRangeMax: number | undefined = levelHihi;
  let warningRangeMin: number | undefined = levelLow;
  let warningRangeMax: number | undefined = levelHigh;

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv) {
    const display = value?.display;

    alarmRangeMin = convertInfAndNanToUndefined(display?.alarmRange?.min);
    alarmRangeMax = convertInfAndNanToUndefined(display?.alarmRange?.max);
    warningRangeMin = convertInfAndNanToUndefined(display?.warningRange?.min);
    warningRangeMax = convertInfAndNanToUndefined(display?.warningRange?.max);

    const pvMin =
      display?.controlRange?.min ?? alarmRangeMin ?? warningRangeMin;
    const pvMax =
      display?.controlRange?.max ?? alarmRangeMax ?? warningRangeMax;
    minimum = pvMin ?? minimum;
    maximum = pvMax ?? maximum;
  }

  const fontCss = font?.css() ?? theme.typography;
  const labelFontStyle = {
    fontSize: fontCss.fontSize,
    fontStyle: font?.css().fontStyle,
    fontFamily: fontCss.fontFamily,
    fontWeight: font?.css().fontWeight,
    fill: foregroundColor?.toString()
  };

  const scaleAxisProps: XAxis<any> = {
    min: minimum,
    max: maximum,
    label: showUnits ? units : undefined,
    scaleType: "linear",
    valueFormatter: (x: number) => formatValue(x, format, 3, "")(),
    labelStyle: {
      ...labelFontStyle,
      display: showUnits ? undefined : "none"
    },
    tickLabelStyle: scaleVisible
      ? {
          ...labelFontStyle
        }
      : {
          display: "none"
        }
  };

  const oppositeScaleAxisProps: XAxis<any> = {
    min: minimum,
    max: maximum,
    disableTicks: true,
    label: undefined,
    scaleType: "linear",
    hideTooltip: true,
    tickLabelStyle: {
      display: "none"
    }
  };

  const disabledAxisProps = {
    data: [""],
    disableTicks: true,
    categoryGapRatio: 0,
    barGapRatio: 0,
    hideTooltip: true,
    tickLabelStyle: {
      display: "none"
    }
  };

  // Setup space for axis and axis labels
  let axisWidth = scaleVisible ? 30 : 10;
  axisWidth = scaleVisible && !displayHorizontal ? axisWidth + 10 : axisWidth;
  axisWidth =
    scaleVisible && !displayHorizontal && format > 1
      ? axisWidth + 10
      : axisWidth;
  axisWidth = showUnits ? axisWidth + 25 : axisWidth;

  const dataBar: Readonly<BarSeries[]> = [
    {
      data: [minimum],
      stack: "total",
      color: Color.fromRgba(194, 198, 195, 0).toString(),
      label: undefined,
      type: "bar",
      valueFormatter: () =>
        `${pvName}: ${numValue ?? "####"} ${value?.display.units ?? ""}`,
      stackOffset: "diverging"
    }
  ];

  const statusAreas = buildStatusRegions(
    alarmRangeMin,
    warningRangeMin,
    warningRangeMax,
    alarmRangeMax,
    minimum,
    maximum,
    props?.colors ?? {},
    showLimits,
    numValue
  );

  return (
    <Box>
      <BarChart
        skipAnimation
        borderRadius={0}
        hideLegend
        margin={{
          left: displayHorizontal ? 20 : Math.max(10, knobSize),
          right: displayHorizontal ? 20 : 2,
          top: displayHorizontal ? Math.max(10, knobSize) : 20,
          bottom: displayHorizontal ? 2 : 20
        }}
        layout={displayHorizontal ? "horizontal" : "vertical"}
        xAxis={
          displayHorizontal
            ? ([
                {
                  ...scaleAxisProps,
                  height: scaleVisible ? axisWidth : 1,
                  position: "bottom",
                  id: "x"
                },
                {
                  ...oppositeScaleAxisProps,
                  position: "top",
                  id: "x2",
                  height: 1
                }
              ] as ReadonlyArray<XAxis<any>>)
            : ([
                {
                  ...disabledAxisProps,
                  id: "x",
                  position: "bottom",
                  height: 1
                },
                { ...disabledAxisProps, id: "x2", position: "top", height: 1 }
              ] as ReadonlyArray<XAxis<any>>)
        }
        yAxis={
          displayHorizontal
            ? ([
                { ...disabledAxisProps, id: "y", position: "left", width: 1 },
                { ...disabledAxisProps, id: "y2", position: "right", width: 1 }
              ] as ReadonlyArray<YAxis<any>>)
            : ([
                {
                  ...scaleAxisProps,
                  width: scaleVisible ? axisWidth : 1,
                  angle: 90,
                  position: "right",
                  id: "y"
                },
                {
                  ...oppositeScaleAxisProps,
                  position: "left",
                  id: "y2",
                  width: 1
                }
              ] as ReadonlyArray<YAxis<any>>)
        }
        series={dataBar}
        sx={{
          height: "100%",
          width: "100%",
          position: "absolute",
          border: 1,
          borderColor: "#D2D2D2",
          borderRadius: "4px",
          backgroundColor: backgroundColor.toString()
        }}
        slotProps={{
          tooltip: {
            sx: {
              [`&.${chartsTooltipClasses.root} .${chartsTooltipClasses.labelCell}`]:
                {
                  display: "none"
                }
            }
          }
        }}
      >
        {displayHorizontal ? (
          <>
            {statusAreas.map((x, idx) => (
              <RectangleAreaHorizontal
                key={`statusAreas${idx}`}
                maximum={x.maximum}
                minimum={x.minimum}
                fill={x.fill}
              />
            ))}
            <ChartsReferenceLine
              x={numValue}
              axisId="x"
              lineStyle={{
                stroke: needleColor?.toString(),
                strokeWidth: needleWidth
              }}
            />
            <TrianglePointerHorizontal
              value={numValue}
              size={knobSize}
              fill={knobColor?.toString()}
            />
          </>
        ) : (
          <>
            {statusAreas.map((x, idx) => (
              <RectangleAreaVertical
                key={`statusAreas${idx}`}
                maximum={x.maximum}
                minimum={x.minimum}
                fill={x.fill}
              />
            ))}
            <ChartsReferenceLine
              y={numValue}
              axisId="y"
              lineStyle={{
                stroke: needleColor?.toString(),
                strokeWidth: needleWidth
              }}
            />
            <TrianglePointerVertical
              value={numValue}
              size={knobSize}
              fill={knobColor?.toString()}
            />
          </>
        )}
      </BarChart>
    </Box>
  );
};

const LinearMeterProps = {
  ...LinearMeterComponentProps,
  ...PVWidgetPropType
};

export const LinearMeter = (
  props: InferWidgetProps<typeof LinearMeterProps>
): JSX.Element => <Widget baseWidget={LinearMeterComponent} {...props} />;

registerWidget(LinearMeter, LinearMeterProps, "linearmeter");
