import React, { useEffect, useMemo, useRef, useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";

import {
  BoolPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt,
  StringPropOpt,
  TracesProp,
  AxesProp,
  ArchivedDataPropOpt,
  IntPropOpt
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
  visible: BoolPropOpt,
  archivedData: ArchivedDataPropOpt,
  archivedDataLoaded: BoolPropOpt,
  bufferSize: IntPropOpt,
  updatePeriod: IntPropOpt
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
    visible = true,
    archivedData = { x: [], y: []},
    archivedDataLoaded = false,
    updatePeriod = 0,
    bufferSize = 10000
  } = props;

  // If we're passed an empty array fill in defaults
  const localAxes = useMemo(
    () => (axes.length > 0 ? [...axes] : [new Axis({ xAxis: false })]),
    [axes]
  );
   // Convert start time into milliseconds period
  const timePeriod = useMemo(() => convertStringTimePeriod(start), [start]);

  const [dateRange, setDateRange] = useState<{ minX: Date; maxX: Date }>({
    minX: new Date(new Date().getTime() - timePeriod),
    maxX: new Date()
  });
  // Use useRef so rerender isn't triggered (overwriting the archivedData) when data updated
  const data = useRef<TimeSeriesPoint[]>([]);

  // useEffect(() => {
  //   // Only update data once the archiveData has loaded
  //   const time = value?.getTime();
  //   const val = value?.getDoubleValue();
  //   if (time && val) {
  //     // Remove data outside min and max bounds
  //     const minimum = new Date(new Date().getTime() - timePeriod);
  //     // Check if first data point in array is outside minimum, if so remove
  //     const xData = data.current.x;
  //     const yData = data.current.y;
  //     if (xData.length === 0) {
  //       // xData.push(value.getTime()!.datetime);
  //       // yData.push(value.getDoubleValue());
  //       data.current = {
  //         ...data.current,
  //         x: [...xData, time.datetime],
  //         y: [...yData, val],
  //         min: minimum,
  //         max: new Date()
  //       };
  //     } else {
  //       // If first data point is outside bounds, is out of time series or data larger than buffer, remove
  //       if (
  //         xData[0].getTime() < minimum.getTime() ||
  //         xData.length > bufferSize
  //       ) {
  //         xData.shift();
  //         yData.shift();
  //       }
  //       // If value time after update period, update
  //       if (
  //         time.datetime.getTime() - xData[xData.length - 1].getTime() >=
  //         updatePeriod
  //       ) {
  //         // xData.push(value.getTime()!.datetime)
  //         // yData.push(value.getDoubleValue())
  //         data.current = {
  //           ...data.current,
  //           x: [...xData, time.datetime],
  //           y: [...yData, val],
  //           min: minimum,
  //           max: new Date()
  //         };
  //       } else {
  //         data.current = {
  //           ...data.current,
  //           x: [...xData],
  //           y: [...yData],
  //           min: minimum,
  //           max: new Date()
  //         };
  //       }
  //     }
  //   }
  // }, [value, timePeriod, bufferSize, updatePeriod]);

  // useEffect(() => {
  //   // Only update data once the archiveData has loaded
  //   // This is never triggered for base striptool, but works for
  //   // databrowser
  //   if (archivedDataLoaded) {
  //     const xData = data.current.x;
  //     const yData = data.current.y;
  //     if (!data.current.dataLoaded && archivedData.x) {
  //       data.current = {
  //         x: xData.concat(archivedData.x),
  //         y: yData.concat(archivedData.y),
  //         dataLoaded: true
  //       };
  //     }
  //   }
  // }, [archivedData, archivedDataLoaded]);

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
        // Remove outdated data points
        let i = 0;
        while (
          i < timeSeries.length &&
          timeSeries[i].dateTime <
            new Date(mostRecentDate.getTime() - timePeriod)
        ) {
          i++;
        }
        const truncatedTimeSeries =
          i - 1 > 0 ? timeSeries.slice(i - 1) : timeSeries;

        // create new data point
        let newTimeseriesPoint: TimeSeriesPoint = { dateTime: mostRecentDate };

        pvData.forEach(pvItem => {
          const { effectivePvName, value } = pvItem;
          newTimeseriesPoint = {
            ...newTimeseriesPoint,
            [effectivePvName]: value?.getDoubleValue() ?? null
          };
        });

        return [...truncatedTimeSeries, newTimeseriesPoint];
      }
        return timeSeries;
    };

    setDateRange({
      minX: new Date(new Date().getTime() - timePeriod),
      maxX: new Date()
    });
    data.current = updateDataMap(data.current);
  }, [timePeriod, pvData]); 

  const { yAxes, yAxesStyle } = useMemo(() => {
    // For some reason the below styling doesn't change axis line and tick
    // colour so we set it using sx in the Line Chart below by passing this in
    const yAxesStyle: any = {};

    localAxes.forEach((item, idx) => {
      yAxesStyle[`.MuiChartsAxis-id-${idx}`] = {
        ".MuiChartsAxis-line": {
          stroke: item.color.toString()
        },
        ".MuiChartsAxis-tick": {
          stroke: item.color.toString()
        }
      };
    });

    const yAxes: ReadonlyArray<YAxis<any>> = localAxes.map(
      (item, idx): YAxis<any> => ({
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
      })
    );

    return { yAxes, yAxesStyle };
  }, [localAxes]);

  const xAxis: ReadonlyArray<XAxis<any>> = useMemo(
    () => [
      {
        color: foregroundColor.toString(),
        dataKey: "dateTime",
        min: dateRange.minX,
        max: dateRange.maxX,
        scaleType: "time",
        id: "xaxis"
      }
    ],
    [dateRange, foregroundColor]
  );

  const series = useMemo(
    () =>
      (traces?.length > 0 ? traces : [new Trace()])
        ?.map((item, index) => {
          const pvName = item?.yPv;
          const effectivePvName = pvData
            ?.map(pvItem => pvItem.effectivePvName)
            ?.find(
              effectivePvName => pvName && effectivePvName?.endsWith(pvName)
            );
          if (!effectivePvName) {
            return null;
          }

          return {
            id: index,
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
        .filter(x => !!x),
    [traces, pvData, visible]
  );

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
        grid={{ vertical: localAxes[0].showGrid, horizontal: showGrid }}
        dataset={data.current}
        sx={{
          width: "100%",
          height: "95%",
          backgroundColor: backgroundColor.toString(),
          ".MuiChartsAxis-id-xaxis": {
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
        slotProps={{ legend: { sx: { color: foregroundColor.toString() } } }}
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
