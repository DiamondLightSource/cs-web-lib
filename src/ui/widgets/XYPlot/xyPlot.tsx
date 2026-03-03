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
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import {
  calculateAxisLimits,
  createAxes,
  createTraces,
  NewAxisSettings
} from "./xyPlotOptions";
import { getPvValueAndName, trimFromString } from "../utils";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";
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
    axes = [new Axis({ xAxis: true }), new Axis({ xAxis: false })]
  } = props;
  const { value } = getPvValueAndName(pvData);

  // TO DO - having all these checks is not ideal
  if (value?.value.arrayValue && axes && traces && width && height) {
    const bytesPerElement = value.value.arrayValue.BYTES_PER_ELEMENT;
    // If data exists, creates traces to plot
    const dataSet = createTraces(traces, value, bytesPerElement);
    // Set up style
    if (!showPlotBorder) {
      style = { ...style, border: { ...style?.border, borderWidth: "0" } };
    }

    const font = style?.font;
    // Sometimes font is a string with "px" on the end
    if (typeof font?.fontSize === "string")
      font.fontSize = trimFromString(font.fontSize);

    const newAxisOptions = createAxes(axes, font);
    newAxisOptions.forEach((newAxis: NewAxisSettings, index: number) => {
      newAxis = calculateAxisLimits(axes[index], newAxis, dataSet);
    });
    // Set up plot appearance
    const plotLayout: any = {
      margin: {
        t: 20,
        b: 5,
        l: 5,
        r: 5
      },
      overflow: "hidden",
      paper_bgcolor: style?.colors?.backgroundColor,
      plot_bgcolor: style?.colors?.backgroundColor,
      showlegend: showLegend,
      width: width - 5,
      height: height - 5,
      title: {
        text: title,
        font: {
          family: font?.fontFamily,
          size: font?.fontSize
        }
      },
      uirevision: 1 // This number needs to stay same to persist zoom on refresh
    };
    // TO DO - better way of coordinating axis names
    const axisNames = ["xaxis", "yaxis", "yaxis2", "yaxis3"];
    const len = newAxisOptions.length;
    for (let i = 0; i < len; i++) {
      plotLayout[axisNames[i]] = newAxisOptions.shift();
    }
    return (
      <Box className={"showBorder"} sx={style?.border}>
        <Plot data={dataSet} layout={plotLayout} />
      </Box>
    );
  }
  // If doesn't pass checks above, render empty box with msg
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
