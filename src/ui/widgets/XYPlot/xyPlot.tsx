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
  TracesPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Box, Typography } from "@mui/material";
import {
  ChartsContainer,
  BarPlot,
  ChartsLegend,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  MarkPlot
} from "@mui/x-charts";
import { Axes } from "../../../types/axis";
import { fontToCss, newFont } from "../../../types/font";
import { useStyle } from "../../hooks/useStyle";
import { DatasetElementType } from "@mui/x-charts/internals";
import {
  buildPlotDataSet,
  buildSeries,
  buildXAxes,
  buildYAxes
} from "./xyPlot.utilities";

const widgetName = "xyplot";

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
    showLegend = false,
    visible = true
  } = props;

  const { yAxes, yAxesStyle } = useMemo(() => buildYAxes(axes as Axes), [axes]);
  const { xAxis, hasXAxisData } = useMemo(
    () => buildXAxes(traces, style, pvData),
    [traces, style, pvData]
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

      {plotDataSet?.length > 0 && (
        <ChartsContainer
          skipAnimation
          dataset={plotDataSet}
          series={series}
          xAxis={xAxis}
          yAxis={yAxes}
          sx={{
            width: "100%",
            height: "95%",
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
        >
          <BarPlot />
          <LinePlot
            slotProps={{
              line: ({ seriesId }) => {
                const trace = traces?.[Number(seriesId)];
                // this hides the line if no line should be visible
                if (trace?.traceType === 0) {
                  return {
                    stroke: "transparent"
                  };
                }
                return {};
              }
            }}
          />
          <MarkPlot />
          <ChartsXAxis />
          <ChartsYAxis />

          {showLegend && (
            <ChartsLegend
              slotProps={{
                legend: {
                  sx: { color: style?.colors?.color }
                }
              }}
            />
          )}
        </ChartsContainer>
      )}
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
