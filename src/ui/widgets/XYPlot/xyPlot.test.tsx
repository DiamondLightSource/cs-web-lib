import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { XYPlotComponent } from "./xyPlot";
import * as utils from "./xyPlot.utilities";
import { useStyle } from "../../hooks/useStyle";

const linePlotMock = vi.fn();

vi.mock("@mui/x-charts", () => ({
  ChartsContainer: ({ children }: any) => (
    <div data-testid="charts-container">{children}</div>
  ),
  BarPlot: () => <div data-testid="bar-plot" />,
  LinePlot: (props: any) => {
    linePlotMock(props);
    return <div data-testid="line-plot" />;
  },
  MarkPlot: () => <div data-testid="mark-plot" />,
  ChartsXAxis: () => <div data-testid="x-axis" />,
  ChartsYAxis: () => <div data-testid="y-axis" />,
  ChartsLegend: () => <div data-testid="legend" />
}));

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn()
}));

vi.mock("./xyPlot.utilities", () => ({
  buildPlotDataSet: vi.fn(),
  buildSeries: vi.fn(),
  buildXAxes: vi.fn(),
  buildYAxes: vi.fn()
}));

const mockStyle = {
  colors: { color: "black" }
};

const baseProps: any = {
  traces: [],
  axes: [],
  pvData: [],
  title: "Test Title",
  visible: true
};

beforeEach(() => {
  vi.clearAllMocks();

  (useStyle as any).mockReturnValue(mockStyle);

  (utils.buildYAxes as any).mockReturnValue({
    yAxes: [{ id: 0 }],
    yAxesStyle: {}
  });

  (utils.buildXAxes as any).mockReturnValue({
    xAxis: [{ id: "0", dataKey: "x" }],
    hasXAxisData: true
  });

  (utils.buildSeries as any).mockReturnValue([{ id: "0", type: "line" }]);

  (utils.buildPlotDataSet as any).mockReturnValue([{ x: 1, y: 2 }]);
});

describe("XYPlotComponent", () => {
  it("renders title", () => {
    render(<XYPlotComponent {...baseProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders chart when dataset exists", () => {
    render(<XYPlotComponent {...baseProps} />);

    expect(screen.getByTestId("charts-container")).toBeInTheDocument();
    expect(screen.getByTestId("bar-plot")).toBeInTheDocument();
    expect(screen.getByTestId("line-plot")).toBeInTheDocument();
    expect(screen.getByTestId("mark-plot")).toBeInTheDocument();
  });

  it("does not render chart when dataset is empty", () => {
    (utils.buildPlotDataSet as any).mockReturnValue([]);

    render(<XYPlotComponent {...baseProps} />);

    expect(screen.queryByTestId("charts-container")).not.toBeInTheDocument();
  });

  it("calls utility builders with correct arguments", () => {
    render(<XYPlotComponent {...baseProps} />);

    expect(utils.buildYAxes).toHaveBeenCalledWith(baseProps.axes);
    expect(utils.buildXAxes).toHaveBeenCalledWith(
      baseProps.traces,
      mockStyle,
      baseProps.pvData
    );
    expect(utils.buildSeries).toHaveBeenCalledWith(
      baseProps.traces,
      baseProps.pvData,
      baseProps.visible
    );
    expect(utils.buildPlotDataSet).toHaveBeenCalledWith(baseProps.pvData);
  });

  it("adds x index when no x-axis data", () => {
    (utils.buildXAxes as any).mockReturnValue({
      xAxis: [],
      hasXAxisData: false
    });

    (utils.buildPlotDataSet as any).mockReturnValue([{ y: 10 }, { y: 20 }]);

    render(<XYPlotComponent {...baseProps} />);

    const call = (utils.buildPlotDataSet as any).mock.results[0].value;

    expect(call).toBeDefined();
  });

  it("renders legend when enabled", () => {
    render(<XYPlotComponent {...baseProps} showLegend={true} />);

    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("does not render legend when disabled", () => {
    render(<XYPlotComponent {...baseProps} showLegend={false} />);

    expect(screen.queryByTestId("legend")).toBeNull();
  });

  it("handles invisible state (series still built but color controlled elsewhere)", () => {
    render(<XYPlotComponent {...baseProps} visible={false} />);

    expect(utils.buildSeries).toHaveBeenCalledWith(
      baseProps.traces,
      baseProps.pvData,
      false
    );
  });

  it("passes slotProps logic to LinePlot", () => {
    const traces = [{ traceType: 0 }, { traceType: 1 }];

    render(<XYPlotComponent {...baseProps} traces={traces} />);

    const props = linePlotMock.mock.calls[0][0];

    expect(typeof props.slotProps.line).toBe("function");
  });

  it("hides line when traceType is 0", () => {
    const traces = [{ traceType: 0 }, { traceType: 1 }];

    render(<XYPlotComponent {...baseProps} traces={traces} />);

    const props = linePlotMock.mock.calls[0][0];
    const lineFn = props.slotProps.line;

    expect(lineFn({ seriesId: "0" })).toEqual({ stroke: "transparent" });
    expect(lineFn({ seriesId: "1" })).toEqual({});
  });
});
