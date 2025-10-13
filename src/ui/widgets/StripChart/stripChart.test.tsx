import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { Color, DType } from "../../../types";
import { StripChartComponent } from "./stripChart";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";
import { convertStringTimePeriod } from "../utils";

// Mock the MUI X-Charts components
vi.mock("@mui/x-charts", () => ({
  LineChart: vi.fn(({ series, xAxis, yAxis, sx }) => (
    <div
      data-testid="line-chart"
      data-series={JSON.stringify(series)}
      data-xaxis={JSON.stringify(xAxis)}
      data-yaxis={JSON.stringify(yAxis)}
      style={sx}
    />
  ))
}));

// vi.mock("@mui/x-charts", () => ({
//   XAxis: vi.fn(),
//   YAxis: vi.fn()
// }));

vi.mock("@mui/material", () => ({
  Box: vi.fn(({ children }) => <div data-testid="mui-box">{children}</div>),
  Typography: vi.fn(({ children }) => (
    <div data-testid="mui-typography">{children}</div>
  ))
}));

describe("StripChartComponent", () => {
  // Basic test setup
  const defaultProps = {
    value: {
      getDoubleValue: () => 50,
      getTime: () => {
        new Date(Date.now());
      }
    } as Partial<DType> as DType,
    connected: true,
    readonly: true,
    pvName: "TEST:PV",
    traces: [new Trace()],
    axes: [new Axis()]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders with default props", () => {
      render(<StripChartComponent {...defaultProps} />);

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();

      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");
      expect(yAxisData[0].position).toBe("left");
      expect(xAxisData[0].scaleType).toBe("time");
    });

    test("renders with 2 y axes", () => {
      const axes = [
        new Axis({ color: Color.RED }),
        new Axis({ color: Color.BLUE })
      ];
      render(<StripChartComponent {...defaultProps} axes={axes} />);

      const lineChart = screen.getByTestId("line-chart");
      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");

      expect(yAxisData[0].color).toBe(Color.RED.toString());
      expect(yAxisData[1].color).toBe(Color.BLUE.toString());
    });

    test("renders with 5 minute x axis period", () => {
      const expectedDiff = 300000; // 5 * 60 * 1000
      render(<StripChartComponent {...defaultProps} start={"5 minutes"} />);
      const lineChart = screen.getByTestId("line-chart");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");

      const actualDiff =
        new Date(xAxisData[0].max).getTime() -
        new Date(xAxisData[0].min).getTime();

      expect(actualDiff).toBe(expectedDiff);
    });

    test("renders with 2 traces", () => {
      const traces = [
        new Trace({ color: Color.ORANGE }),
        new Trace({ color: Color.PINK })
      ];
      render(<StripChartComponent {...defaultProps} traces={traces} />);
      const lineChart = screen.getByTestId("line-chart");
      const seriesData = JSON.parse(
        lineChart.getAttribute("data-series") ?? ""
      );

      expect(seriesData[0].color).toBe(Color.ORANGE.toString());
      expect(seriesData[1].color).toBe(Color.PINK.toString());
    });

    test("renders with a title", () => {
      render(<StripChartComponent {...defaultProps} title="Testing Plot" />);

      expect(screen.getByText("Testing Plot")).toBeDefined();
    });
  });

  describe("Styling", () => {
    test("applies tracetype to trace", () => {
      const traces = [new Trace({ traceType: 5 })];

      render(<StripChartComponent {...defaultProps} traces={traces} />);

      const lineChart = screen.getByTestId("line-chart");
      const seriesData = JSON.parse(
        lineChart.getAttribute("data-series") ?? ""
      );

      expect(seriesData[0].area).toBe(true);
    });

    test("applies background colour", () => {
      render(
        <StripChartComponent {...defaultProps} backgroundColor={Color.PURPLE} />
      );

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart.style.backgroundColor).toBe("rgb(127, 0, 127)");
    });

    test("applies custom x axis colour", () => {
      render(
        <StripChartComponent {...defaultProps} foregroundColor={Color.YELLOW} />
      );

      const lineChart = screen.getByTestId("line-chart");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");
      expect(xAxisData[0].color).toBe("rgba(255,255,0,1)");
    });

    test("applies diamond markers to trace", () => {
      const traces = [new Trace({ pointType: 3 })];
      render(<StripChartComponent {...defaultProps} traces={traces} />);

      const lineChart = screen.getByTestId("line-chart");
      const seriesData = JSON.parse(
        lineChart.getAttribute("data-series") ?? ""
      );

      expect(seriesData[0].showMark).toBe(true);
      expect(seriesData[0].shape).toBe("diamond");
    });

    test("applies log scale to y axis", () => {
      const axes = [new Axis({ logScale: true })];
      render(<StripChartComponent {...defaultProps} axes={axes} />);

      const lineChart = screen.getByTestId("line-chart");
      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");

      expect(yAxisData[0].scaleType).toBe("symlog");
    });
  });
});

describe("convertStringTimePeriod()", () => {
  test("it defaults to 1 minute", () => {
    const period = convertStringTimePeriod("fake string");
    expect(period).toBe(60000);
  });

  test("it correctly parses single day", () => {
    const period = convertStringTimePeriod("day");
    expect(period).toBe(86400000);
  });

  test("it correctly parses 50 hours", () => {
    const period = convertStringTimePeriod("50 hours");
    expect(period).toBe(180000000);
  });
});
