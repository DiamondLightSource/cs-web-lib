import React from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  ColorPropOpt,
  StringPropOpt,
  FontPropOpt,
  AxesProp,
  BoolPropOpt,
  FloatPropOpt,
  TracesProp
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import createPlotlyComponent from "react-plotly.js/factory";
import {
  calculateAxisLimits,
  createAxes,
  createTraces,
  NewAxisSettings
} from "./xyPlotOptions";
import { getPvValueAndName, trimFromString } from "../utils";
import { Trace } from "../../../types/trace";
import { Axes, Axis, newAxis } from "../../../types/axis";
import { useStyle } from "../../hooks/useStyle";
import { Box } from "@mui/material";

const widgetName = "xyplot";

export const XYPlotProps = {
  height: FloatPropOpt,
  width: FloatPropOpt,
  plotBackgroundColor: ColorPropOpt,
  title: StringPropOpt,
  titleFont: FontPropOpt,
  showLegend: BoolPropOpt,
  showPlotBorder: BoolPropOpt,
  showToolbar: BoolPropOpt,
  traces: TracesProp,
  axes: AxesProp
};

// Create plot component from minimal Plotly package
// This is necessary because normal Plot component is too large,
// and causing issues in clients using cs-web-lib with memory
const Plot = createPlotlyComponent(Plotly);

export type XYPlotComponentProps = InferWidgetProps<typeof XYPlotProps> &
  PVComponent;

export const XYPlotComponent = (props: XYPlotComponentProps): JSX.Element => {
  let style = useStyle(
    { backgroundColor: props.plotBackgroundColor, font: props.titleFont },
    widgetName
  );

  const {
    height = 250,
    width = 400,
    pvData,
    title = "",
    showLegend = true,
    showPlotBorder,
    // showToolbar, // TO DO - do we want a toolbar as well?
    traces = [new Trace()],
    axes = [newAxis({ xAxis: true }), newAxis({ xAxis: false })]
  } = props;
  const { value } = getPvValueAndName(pvData);

  return (
    <Box
      sx={{
        ...style?.font,
        ...style?.border,
        borderWidth: "2px",
        borderColor: "red",
        padding: "1px"
      }}
    >
      XYPlot could not be displayed. Please check the .opi file and connection
      to PV {traces[0].yPv}.
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
