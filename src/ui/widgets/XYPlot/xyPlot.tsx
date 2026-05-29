import React, { useMemo } from "react";
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
  TracesPropOpt,
  AxisProp,
  MarkersPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Box, Typography } from "@mui/material";
import {
  BarPlot,
  ChartsLegend,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot,
  ChartsTooltip,
  ChartsAxisHighlight,
  ChartsSurface,
  ChartsDataProvider,
  ChartsReferenceLine
} from "@mui/x-charts";
import { Axes, Axis } from "../../../types/axis";
import { fontToCss, newFont } from "../../../types/font";
import { useStyle } from "../../hooks/useStyle";
import { DatasetElementType } from "@mui/x-charts/internals";
import {
  buildMarkerDataSet,
  buildPlotDataSet,
  buildSeries,
  buildXAxes,
  buildYAxes
} from "./xyPlot.utilities";
import { Trace } from "../../../types/trace";
import { Marker } from "../../../types/markers";

const widgetName = "xyplot";

const traceTypesWithoutLines = [0, 3];

const XYPlotProps = {
  traces: TracesPropOpt,
  marker: MarkersPropOpt,
  axes: AxesProp,
  xAxis: AxisProp,
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
    marker,
    axes,
    xAxis,
    pvData,
    title,
    titleFont = newFont(),
    scaleFont = newFont(),
    labelFont = newFont(),
    showLegend = true,
    visible = true
  } = props;

  const { yAxes, yAxesStyle } = useMemo(() => buildYAxes(axes as Axes), [axes]);
  const { xAxis: xAxisMui, hasXAxisData } = useMemo(
    () => buildXAxes(traces as Trace[], style, xAxis as Axis),
    [traces, style, xAxis]
  );

  const series = useMemo(
    () => buildSeries(traces as Trace[], pvData, visible),
    [traces, pvData, visible]
  );

  let plotDataSet: DatasetElementType<number>[] = useMemo(
    () => buildPlotDataSet(pvData, traces as Trace[]),
    [pvData, traces]
  );

  const markerDataSet = useMemo(
    () => buildMarkerDataSet(pvData, marker as Marker[]),
    [pvData, marker]
  );

  if (!hasXAxisData) {
    plotDataSet = plotDataSet.map((point, i) => ({ ...point, x: i }));
  }

  if (!visible) {
    return <Box></Box>;
  }

  // Use end value - this doesn't seem to do anything in Phoebus?
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
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
      <Box
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        {plotDataSet?.length > 0 && (
          <ChartsDataProvider
            skipAnimation
            dataset={plotDataSet}
            series={series}
            xAxis={xAxisMui}
            yAxis={yAxes}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <ChartsSurface
                sx={{
                  flex: 1,
                  minHeight: 0,
                  ...style?.colors,
                  "& .MuiChartsAxis-root .MuiChartsAxis-line": {
                    stroke: style?.colors?.color
                  },
                  "& .MuiChartsAxis-root .MuiChartsAxis-label": {
                    ...(fontToCss(labelFont) ?? {})
                  },
                  "& .MuiChartsAxis-root .MuiChartsAxis-tickLabel": {
                    fill: style?.colors?.color,
                    ...(fontToCss(scaleFont) ?? {})
                  },
                  "& .MuiChartsAxis-root .MuiChartsAxis-tick": {
                    stroke: style?.colors?.color
                  },
                  ...yAxesStyle
                }}
              >
                <ChartsTooltip trigger="axis" />
                <ChartsAxisHighlight x="line" />
                <BarPlot />
                <LinePlot
                  slotProps={{
                    line: ({ seriesId }) => {
                      const trace = traces?.[Number(seriesId)];
                      // this hides the line if no line should be visible
                      if (
                        trace?.traceType != null &&
                        traceTypesWithoutLines.includes(Number(trace.traceType)) //tracetype can only be string for databrowser
                      ) {
                        return {
                          stroke: "transparent"
                        };
                      }
                      return {};
                    }
                  }}
                />
                <MarkPlot />
                {xAxis?.visible !== false && <ChartsXAxis />}
                {yAxes.map(axis =>
                  axis.visible !== false ? (
                    <ChartsYAxis key={axis.id} axisId={axis.id} />
                  ) : null
                )}

                {markerDataSet
                  ?.filter(m => m?.pvValue)
                  ?.map(marker =>
                    marker.visible !== false ? (
                      <ChartsReferenceLine
                        key={marker.pvName}
                        x={marker.pvValue as number}
                        lineStyle={{
                          stroke: marker.color?.colorString ?? "black"
                        }}
                      />
                    ) : null
                  )}
              </ChartsSurface>

              {showLegend && (
                <ChartsLegend
                  slotProps={{
                    legend: {
                      direction: "horizontal",
                      position: { vertical: "bottom", horizontal: "start" },
                      sx: { color: style?.colors?.color }
                    }
                  }}
                />
              )}
            </Box>
          </ChartsDataProvider>
        )}
      </Box>
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
