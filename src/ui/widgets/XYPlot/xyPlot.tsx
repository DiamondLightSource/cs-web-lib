import React, { useEffect, useMemo, useRef, useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";

import {
  BoolPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt,
  StringPropOpt,
  AxesProp,
  ArchivedDataPropOpt,
  IntPropOpt,
  TracesPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Box, Typography } from "@mui/material";
import { CurveType, LineChart, XAxis, YAxis } from "@mui/x-charts";
import {
  getPvValueByPvName,
} from "../utils";
import { Trace } from "../../../types/trace";
import { Axes, newAxis } from "../../../types/axis";
import {
  dTypeCoerceArray
} from "../../../types/dtypes";
import { fontToCss, newFont } from "../../../types/font";
import { useStyle, UseStyleResult } from "../../hooks/useStyle";
import { DatasetElementType } from "@mui/x-charts/internals";
import { PvDatum } from "../../../redux/csState";

const widgetName = "xyplot";

const MARKER_STYLES: any[] = [
  undefined,
  "square",
  "circle",
  "diamond",
  "cross",
  "triangle"
];

const XYPlotProps = {
  traces: TracesPropOpt,
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
export type XYPlotComponentProps = InferWidgetProps<typeof XYPlotProps> &
  PVComponent;

export interface TimeSeriesPoint {
  dateTime: Date;
  [key: string]: Date | number | null;
}

export const XYPlotComponent = (props: XYPlotComponentProps): JSX.Element => {
  const style = useStyle(props, widgetName);

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
    visible = true
  } = props;

  console.log("XYPlotComponent");

  const { yAxes, yAxesStyle } = useMemo(() => buildYAxes(axes as Axes), [axes]);
  const { xAxis, hasXAxisData } = useMemo(
    () => buildXAxes(traces, style, pvData),
    [traces, style]
  );
  const series = useMemo(
    () => buildSeries(traces, pvData, visible),
    [traces, pvData, visible]
  );

  let plotDataSet: DatasetElementType<number>[] = useMemo(
    () => buildPlotDataSet(pvData),
    [pvData]
  );
  if (!hasXAxisData) {
    plotDataSet = plotDataSet.map((point, i) => ({ ...point, x: i }));
  }

  console.log(plotDataSet);
  console.log(series);
  console.log(xAxis);
  console.log(yAxes);

  // Use end value - this doesn't seem to do anything in Phoebus?
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Typography
        sx={{
          ...fontToCss(titleFont),
          width: "100%",
          height: "5%",
          textAlign: "center",
          ...style?.colors
        }}
      >
        {title}
      </Typography>
      <LineChart
        hideLegend={!showLegend}
        grid={{ vertical: showGrid, horizontal: axes?.[0]?.showGrid ?? false }}
        dataset={plotDataSet}
        sx={{
          width: "100%",
          height: "95%",
          backgroundColor: style?.colors?.backgroundColor,
          ".MuiChartsAxis-id-xaxis": {
            ".MuiChartsAxis-line": {
              stroke: style?.colors?.color
            },
            ".MuiChartsAxis-label": {
              ...(fontToCss(labelFont) ?? {})
            },
            ".MuiChartsAxis-tickLabel": {
              fill: style?.colors?.color,
              ...(fontToCss(scaleFont) ?? {})
            },
            ".MuiChartsAxis-tick": {
              stroke: style?.colors?.color
            }
          },
          ...yAxesStyle
        }}
        xAxis={xAxis}
        yAxis={yAxes}
        series={series}
        slotProps={{ legend: { sx: { color: style?.colors?.color } } }}
      />
    </Box>
  );
};

const XYPlotWidgetProps = {
  ...XYPlotProps,
  ...PVWidgetPropType
};

export const XYPlot = (
  props: InferWidgetProps<typeof XYPlotWidgetProps>
): JSX.Element => <Widget baseWidget={XYPlotComponent} {...props} />;

registerWidget(XYPlot, XYPlotWidgetProps, widgetName);

const buildYAxes = (
  axes: Axes
): {
  yAxes: ReadonlyArray<YAxis<any>>;
  yAxesStyle: {
    [axisSelector: string]: { [styleSelector: string]: { stroke: string } };
  };
} => {
  const localAxes =
    axes.length > 0 ? [...(axes as Axes)] : [newAxis({ xAxis: false })];

  const yAxesStyle: { [k: string]: { [k2: string]: { stroke: string } } } =
    Object.fromEntries(
      localAxes.map(({ color }, idx) => [
        `.MuiChartsAxis-id-${idx}`,
        {
          ".MuiChartsAxis-line": { stroke: color.colorString },
          ".MuiChartsAxis-tick": { stroke: color.colorString }
        }
      ])
    );

  const yAxes: ReadonlyArray<YAxis<any>> = localAxes.map(
    (item, idx): YAxis<any> => {
      const titleFont = fontToCss(item.titleFont);
      const scaleFont = fontToCss(item.scaleFont);
      return {
        width: 55,
        id: idx,
        label: item.title,
        color: item.color?.colorString,
        labelStyle: {
          ...titleFont,
          fill: item.color.colorString
        },
        tickLabelStyle: {
          ...scaleFont,
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
      };
    }
  );

  return { yAxes, yAxesStyle };
};

const buildXAxes = (
  traces: (Trace | null | undefined)[] | undefined,
  style: UseStyleResult,
  pvData: PvDatum[]
) => {
  const xAxisPvNamesAndIds = (
    traces != null && traces?.length > 0 ? traces : [new Trace()]
  )
    ?.filter(trace => trace != null && trace?.xPv != null)
    ?.map(trace => {
      const { value } = getPvValueByPvName(pvData, trace?.xPv as string);
      const controlRange = value?.display?.controlRange;
      const pvMin = Number.isNaN(Number(controlRange?.min)) ? undefined : controlRange?.min;
      const pvMax = Number.isNaN(Number(controlRange?.max)) ? undefined : controlRange?.max;

      return { pvName: trace?.xPv, axisId: trace?.axis, pvMin, pvMax };
    })
    ?.reduce((acc, curr) => {
      if (!acc.find(item => item.axisId === curr.axisId)) {
        acc.push(curr);
      }
      return acc;
    }, [] as any[]);

  const hasXAxisData = xAxisPvNamesAndIds.length > 0;
  if (!hasXAxisData) {
    xAxisPvNamesAndIds.push({ pvName: "x", axisId: 0 });
  }

  const xAxis: ReadonlyArray<XAxis<any>> = xAxisPvNamesAndIds?.map(
    xAxisData => {
      return {
        color: style?.colors?.color,
        dataKey: xAxisData.pvName,
        id: `${xAxisData?.axisId}`,
        min: xAxisData?.pvMin,
        max: xAxisData?.pvMax
      };
    }
  );

  return { xAxis, hasXAxisData };
};

const buildSeries = (
  traces: (Trace | null | undefined)[] | undefined,
  pvData: PvDatum[],
  visible: boolean
): {
  [key: string]:
    | string
    | number
    | boolean
    | CurveType
    | { strokeWidth: number };
}[] => {
  return (traces != null && traces?.length > 0 ? traces : [new Trace()])
    ?.filter(trace => trace != null)
    ?.map((trace, index) => {
      const yPvName = trace?.yPv;

      const effectiveYPvName = pvData
        ?.map(pvItem => pvItem.effectivePvName)
        ?.find(
          effectivePvName => yPvName && effectivePvName?.endsWith(yPvName)
        );

      if (!effectiveYPvName) {
        return null;
      }

      return {
        id: index,
        dataKey: effectiveYPvName,
        label: trace?.name ?? yPvName,
        color: visible ? trace.color.colorString : "transparent",
        showMark: trace.pointType === 0 ? false : true,
        shape: MARKER_STYLES[trace.pointType],
        line: {
          strokeWidth: trace.lineWidth - 1
        },
        area: trace.traceType === 5 ? true : false,
        connectNulls: false,
        curve: trace.traceType === 2 ? ("stepAfter" as CurveType) : "linear"
      };
    })
    .filter(x => !!x);
};

const buildPlotDataSet = (pvData: PvDatum[]): DatasetElementType<number>[] => {
  const remappedData = pvData
    ?.filter(datum => datum != null && datum?.effectivePvName)
    ?.map(datum => ({
      [datum?.effectivePvName]:
        datum?.value != null ? dTypeCoerceArray(datum?.value) : []
    }))
    ?.reduce((acc, obj) => ({ ...acc, ...obj }), {});

  const minSeriesLength = Math.min(
    ...Object.values(remappedData).map(x => x.length)
  );
  const keys = Object.keys(remappedData);

  return Array.from({ length: minSeriesLength }, (_, i) =>
    Object.fromEntries(keys.map(key => [key, Number(remappedData[key][i])]))
  );
};
