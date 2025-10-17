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

interface TimeSeriesPoint {
  dateTime: Date;
  [key: string]: Date | number | null;
}

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
  const [minX, setMinX] = useState<Date>(
    new Date(new Date().getTime() - timePeriod)
  );
  const [maxX, setMaxX] = useState<Date>(new Date());
  const [data, setData] = useState<TimeSeriesPoint[]>([]);

  useEffect(() => {
    setData(currentData => {
      // Remove outdated data points
      let i = 0;
      while (i < currentData.length && currentData[i].dateTime < minX) {
        i++;
      }

      return i - 1 > 0 ? currentData.slice(i - 1) : currentData;
    });
  }, [minX]);

  useEffect(() => {
    const updateDataMap = (timeSeries: TimeSeriesPoint[]) => {
      if (pvData) {
        const allDates = Object.values(pvData)
          .map(pvItem => pvItem?.value?.getTime()?.datetime)
          .filter(date => !!date);
        if (allDates.length < 1) {
          // we have no useful date for the timeseries point
          return timeSeries;
        }

        const mostRecentDate = allDates.reduce(
          (a, b) => (a > b ? a : b),
          allDates[0]
        );

        let newTimeseriesPoint: TimeSeriesPoint = { dateTime: mostRecentDate };

        pvData.forEach(pvItem => {
          const { effectivePvName, value } = pvItem;
          newTimeseriesPoint = {
            ...newTimeseriesPoint,
            [effectivePvName]: value?.getDoubleValue() ?? null
          };
        });

        return [...timeSeries, newTimeseriesPoint];
      }

      return timeSeries;
    };

    setMinX(new Date(new Date().getTime() - timePeriod));
    setMaxX(new Date());

    setData(currentData => updateDataMap(currentData));
  }, [timePeriod, pvData]);

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

  const xAxis: ReadonlyArray<XAxis<any>> = [
    {
      color: foregroundColor.toString(),
      dataKey: "dateTime",
      min: minX,
      max: maxX,
      scaleType: "time"
    }
  ];

  const series = traces
    ?.map((item, index) => {
      const pvName = item?.yPv;
      const effectivePvName = pvData
        ?.map(pvItem => pvItem.effectivePvName)
        ?.find(effectivePvName => pvName && effectivePvName?.endsWith(pvName));
      if (!effectivePvName) {
        return null;
      }

      return {
        id: index, // item.axis <= axes.length - 1 ? item.axis : 0,
        dataKey: effectivePvName,
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
    })
    .filter(x => !!x);

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
        dataset={data}
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
