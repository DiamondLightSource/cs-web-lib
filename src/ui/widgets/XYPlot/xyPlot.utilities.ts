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
import { getPvValueByPvName } from "../utils";
import { Axes, newAxis } from "../../../types/axis";
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
  pvData: PvDatum[]
) => {
  const xAxisPvNamesAndIds = (
    traces != null && traces?.length > 0 ? traces : [new Trace()]
  )
    ?.filter(trace => trace != null && trace?.xPv != null)
    ?.map(trace => {
      const { value } = getPvValueByPvName(pvData, trace?.xPv as string);
      const controlRange = value?.display?.controlRange;
      const pvMin = Number.isNaN(Number(controlRange?.min))
        ? undefined
        : controlRange?.min;
      const pvMax = Number.isNaN(Number(controlRange?.max))
        ? undefined
        : controlRange?.max;

      return {
        pvName: trace?.xPv,
        axisId: trace?.axis,
        pvMin,
        pvMax,
        scaleType: trace?.traceType === 5 ? "band" : "linear"
      };
    })
    ?.reduce((acc, curr) => {
      if (!acc.find(item => item.axisId === curr.axisId)) {
        acc.push(curr);
      }
      return acc;
    }, [] as any[]);

  const hasXAxisData = xAxisPvNamesAndIds.length > 0;
  if (!hasXAxisData) {
    xAxisPvNamesAndIds.push({ pvName: "x", axisId: 0, scaleType: "band" });
  }

  const xAxis: ReadonlyArray<XAxis<any>> = xAxisPvNamesAndIds?.map(
    xAxisData => {
      return {
        color: style?.colors?.color,
        dataKey: xAxisData.pvName,
        id: `${xAxisData?.axisId}`,
        min: xAxisData?.pvMin,
        max: xAxisData?.pvMax,
        scaleType: xAxisData?.scaleType
      };
    }
  );

  return { xAxis, hasXAxisData };
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
