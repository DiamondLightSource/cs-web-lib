import React, { useEffect, useMemo, useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";

import {
  BoolPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt,
  StringPropOpt,
  TracesProp,
  AxesProp
} from "../propTypes";
import { registerWidget } from "../register";
import { Box, Typography } from "@mui/material";
import { CurveType, LineChart, XAxis, YAxis } from "@mui/x-charts";
import { Color, Font } from "../../../types";
import { convertStringTimePeriod, getPvValueAndName } from "../utils";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";

const MARKER_STYLES: any[] = [
  undefined,
  "square",
  "circle",
  "diamond",
  "cross",
  "triangle"
];

const StripChartProps = {
  traces: TracesProp,
  axes: AxesProp,
  start: StringPropOpt,
  end: StringPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  showGrid: BoolPropOpt,
  title: StringPropOpt,
  titleFont: FontPropOpt,
  labelFont: FontPropOpt,
  scaleFont: FontPropOpt,
  showLegend: BoolPropOpt,
  showToolbar: BoolPropOpt,
  visible: BoolPropOpt
};

// Needs to be exported for testing
export type StripChartComponentProps = InferWidgetProps<
  typeof StripChartProps
> &
  PVComponent;

export const StripChartComponent = (
  props: StripChartComponentProps
): JSX.Element => {
  const {
    traces,
    axes,
    pvData,
    title,
    titleFont = new Font(),
    scaleFont = new Font(),
    labelFont = new Font(),
    showGrid = false,
    showLegend = false,
    foregroundColor = Color.fromRgba(0, 0, 0, 1),
    backgroundColor = Color.fromRgba(255, 255, 255, 1),
    start = "1 minute",
    visible = true
  } = props;

  // If we're passed an empty array fill in defaults
  if (traces.length < 1) traces.push(new Trace());
  if (axes.length < 1) axes.push(new Axis({ xAxis: false }));

  // Convert start time into milliseconds period
  const timePeriod = useMemo(() => convertStringTimePeriod(start), [start]);
  const [data, setData] = useState<{
    [pvName: string]: {
      x: Date[];
      y: (number | null)[];
      min?: Date;
      max?: Date;
    };
  }>({});

  useEffect(() => {
    const { value, pvName } = getPvValueAndName(pvData);

    if (value && pvName) {
      // rRemove data outside min and max bounds
      const minimum = new Date(new Date().getTime() - timePeriod);
      // Check if first data point in array is outside minimum, if so remove
      setData(currentData => {
        const xData = currentData[pvName]?.x ?? [];
        const yData = currentData[pvName]?.y ?? [];

        if (xData.length > 0 && xData[0].getTime() < minimum.getTime()) {
          xData.shift();
          yData.shift();
        }
        currentData[pvName] = {
          x: [...xData, value.getTime()?.datetime ?? xData[-1]],
          y: [...yData, value.getDoubleValue() ?? null],
          min: minimum,
          max: new Date()
        };

        return currentData;
      });
    }
  }, [pvData, timePeriod]);

  // For some reason the below styling doesn't change axis line and tick
  // colour so we set it using sx in the Line Chart below by passing this in
  const yAxesStyle: any = {};

  const yAxes: ReadonlyArray<YAxis<any>> = axes.map((item, idx) => {
    const axis = {
      width: 45,
      id: idx,
      label: item.title,
      color: item.color?.toString(),
      labelStyle: {
        font: item.titleFont.css(),
        fill: item.color.toString()
      },
      tickLabelStyle: {
        font: item.scaleFont.css(),
        fill: item.color.toString()
      },
      scaleType: item.logScale ? "symlog" : "linear",
      position: "left",
      min: item.autoscale ? undefined : item.minimum,
      max: item.autoscale ? undefined : item.maximum
    };
    yAxesStyle[`.MuiChartsAxis-id-${idx}`] = {
      ".MuiChartsAxis-line": {
        stroke: item.color.toString()
      },
      ".MuiChartsAxis-tick": {
        stroke: item.color.toString()
      }
    };
    return axis;
  });

  const { pvName } = getPvValueAndName(pvData);

  const xAxis: ReadonlyArray<XAxis<any>> = [
    {
      data: data[pvName]?.x ?? [],
      color: foregroundColor.toString(),
      dataKey: "datetime",
      min: data[pvName]?.min,
      max: data[pvName]?.max,
      scaleType: "time"
    }
  ];

  const series = traces.map((item, index) => {
    const trace = {
      // If axis is set higher than number of axes, default to zero
      id: index, // item.axis <= axes.length - 1 ? item.axis : 0,
      data: data[pvName]?.y ?? [],
      label: item.name,
      color: visible ? item.color.toString() : "transparent",
      showMark: item.pointType === 0 ? false : true,
      shape: MARKER_STYLES[item.pointType],
      line: {
        strokeWidth: item.lineWidth
      },
      area: item.traceType === 5 ? true : false,
      connectNulls: false,
      curve: item.traceType === 2 ? ("stepAfter" as CurveType) : "linear"
    };
    return trace;
  });

  // TO DO
  // Add error bars option
  // Apply showToolbar
  // Use end value - this doesn't seem to do anything in Phoebus?

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Typography
        sx={{
          font: titleFont.css(),
          width: "100%",
          height: "5%",
          textAlign: "center",
          backgroundColor: backgroundColor.toString(),
          color: foregroundColor.toString()
        }}
      >
        {title}
      </Typography>
      <LineChart
        hideLegend={showLegend}
        grid={{ vertical: axes[0].showGrid, horizontal: showGrid }}
        sx={{
          width: "100%",
          height: "95%",
          backgroundColor: backgroundColor.toString(),
          ".MuiChartsAxis-directionX": {
            ".MuiChartsAxis-line": {
              stroke: foregroundColor.toString()
            },
            ".MuiChartsAxis-label": {
              font: labelFont.css()
            },
            ".MuiChartsAxis-tickLabel": {
              fill: foregroundColor.toString(),
              font: scaleFont.css()
            },
            ".MuiChartsAxis-tick": {
              stroke: foregroundColor.toString()
            }
          },
          ...yAxesStyle
        }}
        xAxis={xAxis}
        yAxis={yAxes}
        series={series}
      />
    </Box>
  );
};

const StripChartWidgetProps = {
  ...StripChartProps,
  ...PVWidgetPropType
};

export const StripChart = (
  props: InferWidgetProps<typeof StripChartWidgetProps>
): JSX.Element => <Widget baseWidget={StripChartComponent} {...props} />;

registerWidget(StripChart, StripChartWidgetProps, "stripchart");
