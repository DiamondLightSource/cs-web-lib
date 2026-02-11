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
import { convertStringTimePeriod } from "../utils";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";
import {
  dTypeGetDoubleValue,
  dTypeGetTime,
  dTimeToDate
} from "../../../types/dtypes";
import { ColorUtils } from "../../../types/color";
import { fontToCss, newFont } from "../../../types/font";

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

export interface TimeSeriesPoint {
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
    titleFont = newFont(),
    scaleFont = newFont(),
    labelFont = newFont(),
    showGrid = false,
    showLegend = false,
    foregroundColor = ColorUtils.fromRgba(0, 0, 0, 1),
    backgroundColor = ColorUtils.fromRgba(255, 255, 255, 1),
    start = "1 minute",
    visible = true,
    archivedData = [],
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
  const dataLoaded = useRef(false);

  useEffect(() => {
    // Only update data once the archiveData has loaded
    // This is never triggered for base striptool, but works for
    // databrowser
    if (archivedDataLoaded && !dataLoaded.current) {
      data.current = archivedData as TimeSeriesPoint[];
      dataLoaded.current = true;
    }
  }, [archivedData, archivedDataLoaded]);

  useEffect(() => {
    const updateDataMap = (timeSeries: TimeSeriesPoint[]) => {
      // Add check for update period here
      if (pvData) {
        const allDates = Object.values(pvData)
          .map(pvItem => dTimeToDate(dTypeGetTime(pvItem?.value)))
          .filter(date => !!date);

        if (allDates.length < 1) {
          // we have no useful date for the timeseries point
          return timeSeries;
        }

        const mostRecentDate = allDates.reduce(
          (a, b) => (a > b ? a : b),
          allDates[0]
        );

        // Don't update if update period hasn't passed
        if (
          timeSeries.length > 0 &&
          mostRecentDate.getTime() - timeSeries[0].dateTime.getTime() <=
            updatePeriod * 1000
        ) {
          return timeSeries;
        }

        // Remove outdated data points
        let i = 0;
        while (
          i < timeSeries.length &&
          timeSeries[i].dateTime <
            new Date(mostRecentDate.getTime() - timePeriod)
        ) {
          i++;
        }
        let truncatedTimeSeries =
          i - 1 > 0 ? timeSeries.slice(i - 1) : timeSeries;
        truncatedTimeSeries =
          truncatedTimeSeries.length >= bufferSize
            ? truncatedTimeSeries.slice(
                truncatedTimeSeries.length + 1 - bufferSize
              )
            : truncatedTimeSeries;
        // If buffer size exceeded, remove old data

        // create new data point
        let newTimeseriesPoint: TimeSeriesPoint = { dateTime: mostRecentDate };

        pvData.forEach(pvItem => {
          const { effectivePvName, value } = pvItem;
          newTimeseriesPoint = {
            ...newTimeseriesPoint,
            [effectivePvName]: dTypeGetDoubleValue(value) ?? null
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
  }, [timePeriod, pvData, bufferSize, updatePeriod]);

  const { yAxes, yAxesStyle } = useMemo(() => {
    // For some reason the below styling doesn't change axis line and tick
    // colour so we set it using sx in the Line Chart below by passing this in
    const yAxesStyle: any = {};

    localAxes.forEach((item, idx) => {
      yAxesStyle[`.MuiChartsAxis-id-${idx}`] = {
        ".MuiChartsAxis-line": {
          stroke: item.color.colorString
        },
        ".MuiChartsAxis-tick": {
          stroke: item.color.colorString
        }
      };
    });

    const yAxes: ReadonlyArray<YAxis<any>> = localAxes.map(
      (item, idx): YAxis<any> => ({
        width: 55,
        id: idx,
        label: item.title,
        color: item.color?.colorString,
        labelStyle: {
          fontSize: fontToCss(item.titleFont)?.fontSize,
          fontStyle: fontToCss(item.titleFont)?.fontStyle,
          fontFamily: fontToCss(item.titleFont)?.fontFamily,
          fontWeight: fontToCss(item.titleFont)?.fontWeight,
          fill: item.color.colorString
        },
        tickLabelStyle: {
          fontSize: fontToCss(item.scaleFont)?.fontSize,
          fontStyle: fontToCss(item.scaleFont)?.fontStyle,
          fontFamily: fontToCss(item.scaleFont)?.fontFamily,
          fontWeight: fontToCss(item.scaleFont)?.fontWeight,
          fill: item.color.colorString,
          angle: item.onRight ? 90 : -90
        },
        valueFormatter: (value: any, context: any) =>
          context.location === "tooltip"
            ? `${value}`
            : value.length > 4
              ? `${value.toExponential(3)}`
              : value,
        scaleType: item.logScale ? "symlog" : "linear",
        position: item.onRight ? "right" : "left",
        min: item.autoscale ? undefined : item.minimum,
        max: item.autoscale ? undefined : item.maximum
      })
    );

    return { yAxes, yAxesStyle };
  }, [localAxes]);

  const xAxis: ReadonlyArray<XAxis<any>> = useMemo(
    () => [
      {
        color: foregroundColor.colorString,
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
            color: visible ? item.color.colorString : "transparent",
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
          font: fontToCss(titleFont) as React.CSSProperties,
          width: "100%",
          height: "5%",
          textAlign: "center",
          backgroundColor: backgroundColor.colorString,
          color: foregroundColor.colorString
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
          backgroundColor: backgroundColor.colorString,
          ".MuiChartsAxis-id-xaxis": {
            ".MuiChartsAxis-line": {
              stroke: foregroundColor.colorString
            },
            ".MuiChartsAxis-label": {
              font: fontToCss(labelFont)
            },
            ".MuiChartsAxis-tickLabel": {
              fill: foregroundColor.colorString,
              font: fontToCss(scaleFont)
            },
            ".MuiChartsAxis-tick": {
              stroke: foregroundColor.colorString
            }
          },
          ...yAxesStyle
        }}
        xAxis={xAxis}
        yAxis={yAxes}
        series={series}
        slotProps={{ legend: { sx: { color: foregroundColor.colorString } } }}
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
