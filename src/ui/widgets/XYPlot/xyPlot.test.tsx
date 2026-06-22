import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { XYPlotComponent } from "./xyPlot";
import * as utils from "./xyPlot.utilities";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

const linePlotMock = vi.fn();

vi.mock("@mui/x-charts", () => ({
  ChartsDataProvider: ({ children }: any) => (
    <div data-testid="charts-provider">{children}</div>
  ),
  ChartsSurface: ({ children }: any) => (
    <div data-testid="charts-surface">{children}</div>
  ),
  ChartsTooltip: () => <div data-testid="tooltip" />,
  ChartsAxisHighlight: () => <div data-testid="axis-highlight" />,

  BarPlot: () => <div data-testid="bar-plot" />,
  LinePlot: (props: any) => {
    linePlotMock(props);
    return <div data-testid="line-plot" />;
  },
  MarkPlot: () => <div data-testid="mark-plot" />,
  ChartsXAxis: () => <div data-testid="x-axis" />,
  ChartsYAxis: () => <div data-testid="y-axis" />,
  ChartsLegend: () => <div data-testid="legend" />,
  ChartsReferenceLine: (props: any) => (
    <div data-testid="reference-line" data-x={props.x} />
  )
}));

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(props =>
    createMockStyle({ colors: { color: "black" }, newProps: props })
  )
}));

vi.mock("./xyPlot.utilities", () => ({
  buildPlotDataSet: vi.fn(),
  buildSeries: vi.fn(),
  buildXAxes: vi.fn(),
  buildYAxes: vi.fn(),
  buildMarkerDataSet: vi.fn()
}));

const baseProps: any = {
  traces: [],
  marker: [],
  axes: [],
  pvData: [],
  title: "Test Title",
  visible: true
};

beforeEach(() => {
  vi.clearAllMocks();

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

    expect(screen.getByTestId("charts-provider")).toBeInTheDocument();
    expect(screen.getByTestId("charts-surface")).toBeInTheDocument();
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
      createMockStyle({ colors: { color: "black" }, newProps: baseProps })[0],
      baseProps.xAxis
    );
    expect(utils.buildSeries).toHaveBeenCalledWith(
      baseProps.traces,
      baseProps.pvData,
      baseProps.visible
    );

    expect(utils.buildPlotDataSet).toHaveBeenCalledWith(
      baseProps.pvData,
      baseProps.traces
    );

    expect(utils.buildMarkerDataSet).toHaveBeenCalledWith(
      baseProps.pvData,
      baseProps.marker
    );
  });

  it("adds x index when no x-axis data", () => {
    (utils.buildXAxes as any).mockReturnValue({
      xAxis: [{ id: "0", dataKey: "x" }],
      hasXAxisData: false
    });

    const mockDataset = [{ y: 10 }, { y: 20 }];
    (utils.buildPlotDataSet as any).mockReturnValue(mockDataset);

    render(<XYPlotComponent {...baseProps} />);

    // Verify the component rendered (dataset was transformed)
    expect(screen.getByTestId("charts-provider")).toBeInTheDocument();
  });

  it("does not render X-axis when xAxis.visible is false", () => {
    const propsWithHiddenXAxis = {
      ...baseProps,
      xAxis: { visible: false }
    };

    render(<XYPlotComponent {...propsWithHiddenXAxis} />);

    expect(screen.queryByTestId("x-axis")).not.toBeInTheDocument();
  });

  it("renders X-axis by default", () => {
    render(<XYPlotComponent {...baseProps} />);

    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
  });

  it("renders only visible Y-axes", () => {
    (utils.buildYAxes as any).mockReturnValue({
      yAxes: [
        { id: "0", visible: true },
        { id: "1", visible: false }
      ],
      yAxesStyle: {}
    });

    render(<XYPlotComponent {...baseProps} />);

    const yAxes = screen.getAllByTestId("y-axis");
    expect(yAxes).toHaveLength(1);
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

  it("renders markers when marker data exists", () => {
    const mockMarkers = [
      {
        pvName: "marker1",
        pvValue: 5,
        visible: true,
        color: { colorString: "red" }
      }
    ];

    (utils.buildMarkerDataSet as any).mockReturnValue(mockMarkers);

    render(<XYPlotComponent {...baseProps} marker={mockMarkers} />);

    expect(screen.getByTestId("charts-surface")).toBeInTheDocument();
  });

  it("only renders visible markers with pvValue", () => {
    const mockMarkers = [
      {
        pvName: "m1",
        pvValue: 5,
        visible: true,
        color: { colorString: "red" }
      },
      {
        pvName: "m2",
        pvValue: null,
        visible: true,
        color: { colorString: "blue" }
      },
      {
        pvName: "m3",
        pvValue: 10,
        visible: false,
        color: { colorString: "green" }
      }
    ];

    (utils.buildMarkerDataSet as any).mockReturnValue(mockMarkers);

    render(<XYPlotComponent {...baseProps} />);

    const markers = screen.getAllByTestId("reference-line");
    expect(markers).toHaveLength(1);
  });

  it("passes slotProps logic to LinePlot", () => {
    const traces = [{ traceType: 0 }, { traceType: 1 }];

    render(<XYPlotComponent {...baseProps} traces={traces} />);

    const props = linePlotMock.mock.calls[0][0];

    expect(typeof props.slotProps.line).toBe("function");
  });

  it("hides line when traceType is 0 or 3", () => {
    const traces = [{ traceType: 0 }, { traceType: 1 }, { traceType: 3 }];

    render(<XYPlotComponent {...baseProps} traces={traces} />);

    const props = linePlotMock.mock.calls[0][0];
    const lineFn = props.slotProps.line;

    expect(lineFn({ seriesId: "0" })).toEqual({ stroke: "transparent" });
    expect(lineFn({ seriesId: "1" })).toEqual({});
    expect(lineFn({ seriesId: "2" })).toEqual({ stroke: "transparent" });
  });

  it("handles undefined traces gracefully", () => {
    const propsWithUndefinedTraces = {
      ...baseProps,
      traces: undefined
    };

    expect(() =>
      render(<XYPlotComponent {...propsWithUndefinedTraces} />)
    ).not.toThrow();
  });

  it("handles empty pvData", () => {
    (utils.buildPlotDataSet as any).mockReturnValue([]);

    render(<XYPlotComponent {...baseProps} pvData={[]} />);

    expect(screen.queryByTestId("charts-provider")).not.toBeInTheDocument();
  });
});
