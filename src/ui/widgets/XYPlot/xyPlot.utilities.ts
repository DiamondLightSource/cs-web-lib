import {
  BarSeriesType,
  DatasetElementType,
  LineSeriesType,
  MarkShape,
  XAxis,
  YAxis
} from "@mui/x-charts/internals";
import { PvDatum } from "../../../redux/csState";
import { dTypeCoerceArray } from "../../../types/dtypes";
import { CurveType } from "@mui/x-charts";
import { Trace } from "../../../types/trace";
import { UseStyleResult } from "../../hooks/useStyle";
import { Axes, Axis, newAxis } from "../../../types/axis";
import { fontToCss } from "../../../types/font";

const MARKER_STYLES: (MarkShape | undefined)[] = [
  undefined,
  "square",
  "circle",
  "diamond",
  "cross",
  "triangle"
];

export const buildPlotDataSet = (
  pvData: PvDatum[]
): DatasetElementType<number>[] => {
  const remappedData = pvData
    ?.filter(
      datum =>
        datum != null &&
        datum?.effectivePvName &&
        datum?.value &&
        dTypeCoerceArray(datum?.value).length > 0
    )
    ?.map(datum => ({
      [datum?.effectivePvName]:
        datum?.value != null ? dTypeCoerceArray(datum?.value) : []
    }))
    ?.reduce((acc, obj) => ({ ...acc, ...obj }), {});

  const values = Object.values(remappedData);
  const minSeriesLength =
    values.length === 0 ? 0 : Math.min(...values.map(x => x.length));
  const keys = Object.keys(remappedData);

  return Array.from({ length: minSeriesLength }, (_, i) =>
    Object.fromEntries(keys.map(key => [key, Number(remappedData[key][i])]))
  );
};

export const buildSeries = (
  traces: (Trace | null | undefined)[] | undefined,
  pvData: PvDatum[],
  visible: boolean
): (LineSeriesType | BarSeriesType)[] => {
  return (traces ?? [new Trace()])
    .filter(trace => trace != null)
    .map((trace, index) => {
      const yPvName = trace?.yPv;

      const effectiveYPvName = pvData
        ?.map(pvItem => pvItem.effectivePvName)
        ?.find(
          effectivePvName => yPvName && effectivePvName?.endsWith(yPvName)
        );

      if (!effectiveYPvName) return null;

      const base = {
        id: `${index}`,
        dataKey: effectiveYPvName,
        yAxisId: String(trace?.axis),
        label: trace.name || `Series ${index + 1}`,
        color: visible ? trace.color.colorString : "transparent"
      };

      if (trace.traceType === 5) {
        const barSeries: BarSeriesType = {
          ...base,
          type: "bar"
        };
        return barSeries;
      }

      const lineSeries: LineSeriesType = {
        ...base,
        type: "line",
        showMark: trace.pointType !== 0,
        curve: trace.traceType === 2 ? ("stepAfter" as CurveType) : "linear",
        connectNulls: false,
        shape: MARKER_STYLES[trace.pointType],
        labelMarkType: "line"
      };

      return lineSeries;
    })
    .filter((x): x is LineSeriesType | BarSeriesType => !!x);
};

export const buildXAxes = (
  traces: (Trace | null | undefined)[] | undefined,
  style: UseStyleResult,
  xAxisDefinition: Axis
) => {
  const isBarChart = traces?.some(trace => trace?.traceType === 5);

  const dataKey = traces?.filter(
    trace => trace != null && trace?.xPv != null
  )?.[0]?.xPv;

  const xAxis: ReadonlyArray<XAxis<any>> = [
    {
      color: style?.colors?.color,
      dataKey: dataKey ?? "x",
      id: "X0",
      label: xAxisDefinition.title,
      scaleType: !isBarChart
        ? xAxisDefinition.logScale
          ? "symlog"
          : "linear"
        : "band",
      min:
        !xAxisDefinition?.autoscale && Number.isFinite(xAxisDefinition?.minimum)
          ? xAxisDefinition?.minimum
          : undefined,
      max:
        !xAxisDefinition?.autoscale && Number.isFinite(xAxisDefinition?.maximum)
          ? xAxisDefinition?.maximum
          : undefined
    }
  ];

  return { xAxis, hasXAxisData: !!dataKey };
};

export const buildYAxes = (
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
        `& .MuiChartsAxis-root[data-axis-id="${idx}"]`,
        {
          "& .MuiChartsAxis-line": { stroke: `${color.colorString}` },
          "& .MuiChartsAxis-tick": { stroke: `${color.colorString}` }
        }
      ])
    );

  const yAxes: ReadonlyArray<YAxis<any>> = localAxes.map(
    (item, idy): YAxis<any> => {
      const titleFont = fontToCss(item.titleFont);
      const scaleFont = fontToCss(item.scaleFont);

      const min =
        !item.autoscale && Number.isFinite(item.minimum)
          ? item.minimum
          : undefined;

      const max =
        !item.autoscale && Number.isFinite(item.maximum)
          ? item.maximum
          : undefined;

      // Prevent invalid range
      const safeMin =
        min !== undefined && max !== undefined && min >= max ? undefined : min;
      const safeMax =
        min !== undefined && max !== undefined && min >= max ? undefined : max;

      return {
        visible: item?.visible,
        width: 55,
        id: String(idy),
        label: item.title,
        color: item.color?.colorString,
        lineColor: item.color?.colorString,
        labelStyle: {
          ...titleFont,
          fill: item.color.colorString
        },
        tickLabelStyle: {
          ...scaleFont,
          fill: item.color.colorString,
          angle: item.onRight ? 90 : -90
        },
        valueFormatter: (value: any, context: any) => {
          if (value == null || Number.isNaN(value)) {
            return "";
          }

          if (context.location === "tooltip") {
            return String(value);
          }

          const abs = Math.abs(value);

          // Use exponential for large/small numbers
          if (abs >= 1e4 || (abs > 0 && abs < 1e-3)) {
            return value.toExponential(3);
          }

          return String(value);
        },
        scaleType: item.logScale ? "symlog" : "linear",
        position: item.onRight ? "right" : "left",
        min: safeMin,
        max: safeMax
      };
    }
  );

  return { yAxes, yAxesStyle };
};
