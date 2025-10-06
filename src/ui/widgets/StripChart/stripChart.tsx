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
import { convertStringTimePeriod } from "../utils";

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
  yAxes: AxesProp,
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

const sample = [1, 10, 30, 50, 70, 90, 100];

export const StripChartComponent = (
  props: StripChartComponentProps
): JSX.Element => {
  const {
    traces,
    yAxes,
    value,
    title,
    titleFont = new Font(),
    scaleFont = new Font(),
    labelFont = new Font(),
    showGrid = false,
    showToolbar = true,
    showLegend = false,
    foregroundColor = Color.fromRgba(0, 0, 0, 1),
    backgroundColor = Color.fromRgba(255, 255, 255, 1),
    start = "1 minute",
    end,
    visible = true
  } = props;

  // Convert start time into milliseconds period
  const timePeriod = useMemo(() => convertStringTimePeriod(start), [start]);
  const [data, setData] = useState<{
    x: any[];
    y: any[];
    min?: Date;
    max?: Date;
  }>({ x: [], y: [] });

  useEffect(() => {
    if (value) {
      // rRemove data outside min and max bounds
      const minimum = new Date(new Date().getTime() - timePeriod);
      // Check if first data point in array is outside minimum, if so remove
      const xData = [...data.x];
      const yData = [...data.y];
      if (data.x.length > 0 && data.x[0].getTime() < minimum.getTime()) {
        xData.shift();
        yData.shift();
      }
      setData({
        x: [...xData, value.getTime()?.datetime],
        y: [...yData, value.getDoubleValue()],
        min: minimum,
        max: new Date()
      });
    }
  }, [value]);

  const axes: ReadonlyArray<YAxis<any>> = yAxes.map(item => {
    const axis = {
      id: item.title,
      label: item.title,
      labelStyle: {
        font: item.titleFont!.css(),
        color: item.color?.toString(),
        sx: {
            transform: "translateX(10px)"
        }
      },
      tickLabelStyle: {
        font: item.scaleFont!.css(),
        color: item.color?.toString()
      },
      scaleType: item.logScale ? "symlog" : "linear",
      position: "left",
      min: item.minimum,
      max: item.maximum
    };
    return axis;
  });

  const xAxis: ReadonlyArray<XAxis<any>> = [
    {
      data: data.x,
      dataKey: "datetime",
      min: data.min,
      max: data.max,
      color: foregroundColor.toString(),
      tickLabelStyle: {
        font: scaleFont.css(),
        color: foregroundColor.toString()
      },
      scaleType: "time"
    }
  ];

  const series = traces.map(item => {
    const trace = {
      // If axis is set higher than number of axes, default to zero
      id: item.axis! <= axes.length - 1 ? axes[item.axis!].id : 0,
      data: data.y,
      label: item.name,
      color: visible ? item.color?.toString() : "transparent",
      showMark: item.pointType === 0 ? false : true,
      shape: MARKER_STYLES[item.pointType!],
      line: {
        strokeWidth: item.lineWidth
      },
      curve: item.traceType === 2 ? "stepAfter" as CurveType: "linear"
    };
    return trace;
  });

  // TO DO
  // use traceType to set different types of plot
  // condense y axes slightly more

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
            grid={{ vertical: yAxes[0].showGrid, horizontal: showGrid }}
            sx={{
                width: "100%",
                height: "95%",
                backgroundColor: backgroundColor.toString(),
                ".MuiChartsAxis-directionX": {
                    font: scaleFont.css(),
                    color: foregroundColor.toString()
                }
            }}
            xAxis={xAxis}
            yAxis={axes}
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
