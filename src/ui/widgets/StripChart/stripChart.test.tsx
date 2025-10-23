import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { Color, DType } from "../../../types";
import { StripChartComponent } from "./stripChart";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";
import { convertStringTimePeriod } from "../utils";
import { PvDatum } from "../../../redux/csState";
import { DTime } from "../../../types/dtypes";

// Mock the MUI X-Charts components
vi.mock("@mui/x-charts", () => ({
  LineChart: vi.fn(({ dataset, series, xAxis, yAxis, sx }) => (
    <div
      data-testid="line-chart"
      data-series={JSON.stringify(series)}
      data-xaxis={JSON.stringify(xAxis)}
      data-yaxis={JSON.stringify(yAxis)}
      data-dataset={JSON.stringify(dataset)}
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
  const buildPvDatum = (
    pvName: string,
    value: number,
    date: Date = new Date()
  ) => {
    return {
      effectivePvName: pvName,
      connected: true,
      readonly: true,
      value: {
        getDoubleValue: () => value,
        getTime: () => new DTime(date)
      } as Partial<DType> as DType
    } as Partial<PvDatum> as PvDatum;
  };

  const defaultProps = {
    pvData: [buildPvDatum("TEST:PV", 50)],
    traces: [new Trace()],
    axes: [new Axis()]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders with default props", () => {
      const renderedObject = render(<StripChartComponent {...defaultProps} />);

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();

      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");

      expect(yAxisData[0].position).toBe("left");
      expect(xAxisData[0].scaleType).toBe("time");

      let dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(1);
      expect(dataset[0]["TEST:PV"]).toBe(50);

      // Render again to check that new data values are added
      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          pvData={[buildPvDatum("TEST:PV", 60)]}
        />
      );

      dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(2);
      expect(dataset[0]["TEST:PV"]).toBe(50);
      expect(dataset[1]["TEST:PV"]).toBe(60);
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
      const { rerender } = render(
        <StripChartComponent {...defaultProps} start={"5 minutes"} />
      );
      rerender(<StripChartComponent {...defaultProps} start={"5 minutes"} />);
      const lineChart = screen.getByTestId("line-chart");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");
      const actualDiff =
        new Date(xAxisData[0].max).getTime() -
        new Date(xAxisData[0].min).getTime();

      expect(actualDiff).toBe(expectedDiff);
    });

    test("renders with 2 traces", () => {
      const traces = [
        new Trace({ color: Color.ORANGE, yPv: "TEST:PV" }),
        new Trace({ color: Color.PINK, yPv: "TEST:PV" })
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

    test("renders multiple PVs with multiple traces, with rerender to add second set of PV data", () => {
      const traces = [
        new Trace({ color: Color.ORANGE, yPv: "PV1" }),
        new Trace({ color: Color.PINK, yPv: "PV2" }),
        new Trace({ color: Color.BLUE, yPv: "PV3" })
      ];

      const renderedObject = render(
        <StripChartComponent
          {...defaultProps}
          traces={traces}
          pvData={[
            buildPvDatum("TEST:PV1", 2),
            buildPvDatum("TEST:PV2", 30),
            buildPvDatum("TEST:PV3", 400)
          ]}
        />
      );

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();

      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");

      expect(yAxisData[0].position).toBe("left");
      expect(xAxisData[0].scaleType).toBe("time");

      let dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(1);
      expect(dataset[0]["TEST:PV1"]).toBe(2);
      expect(dataset[0]["TEST:PV2"]).toBe(30);
      expect(dataset[0]["TEST:PV3"]).toBe(400);

      const seriesData = JSON.parse(
        lineChart.getAttribute("data-series") ?? ""
      );

      expect(seriesData[0].color).toBe(Color.ORANGE.toString());
      expect(seriesData[0].dataKey).toBe("TEST:PV1");
      expect(seriesData[1].color).toBe(Color.PINK.toString());
      expect(seriesData[1].dataKey).toBe("TEST:PV2");
      expect(seriesData[2].color).toBe(Color.BLUE.toString());
      expect(seriesData[2].dataKey).toBe("TEST:PV3");

      // Render again to check that new data values are added
      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          traces={traces}
          pvData={[
            buildPvDatum("TEST:PV1", 3),
            buildPvDatum("TEST:PV2", 40),
            buildPvDatum("TEST:PV3", 500)
          ]}
        />
      );

      dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(2);
      expect(dataset[0]["TEST:PV1"]).toBe(2);
      expect(dataset[1]["TEST:PV1"]).toBe(3);
      expect(dataset[0]["TEST:PV2"]).toBe(30);
      expect(dataset[1]["TEST:PV2"]).toBe(40);
      expect(dataset[0]["TEST:PV3"]).toBe(400);
      expect(dataset[1]["TEST:PV3"]).toBe(500);
    });

    test("renders multiple data points and removes old data values", () => {
      const intialDate = new Date(new Date().getTime() - 600000);
      const renderedObject = render(
        <StripChartComponent
          {...defaultProps}
          pvData={[buildPvDatum("TEST:PV", 10, intialDate)]}
        />
      );

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();

      let dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(1);
      expect(dataset[0]["TEST:PV"]).toBe(10);

      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          pvData={[
            buildPvDatum("TEST:PV", 20, new Date(intialDate.getTime() + 20000))
          ]}
        />
      );

      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          pvData={[
            buildPvDatum("TEST:PV", 30, new Date(intialDate.getTime() + 40000))
          ]}
        />
      );

      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          pvData={[
            buildPvDatum("TEST:PV", 40, new Date(intialDate.getTime() + 70000))
          ]}
        />
      );

      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          pvData={[
            buildPvDatum("TEST:PV", 50, new Date(intialDate.getTime() + 80000))
          ]}
        />
      );

      // Now have 80 seconds of data, this should all still be avaliable, until we add the next data point
      dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(5);
      expect(dataset[0]["TEST:PV"]).toBe(10);
      expect(dataset[1]["TEST:PV"]).toBe(20);
      expect(dataset[2]["TEST:PV"]).toBe(30);
      expect(dataset[3]["TEST:PV"]).toBe(40);
      expect(dataset[4]["TEST:PV"]).toBe(50);

      renderedObject.rerender(
        <StripChartComponent
          {...defaultProps}
          pvData={[
            buildPvDatum("TEST:PV", 60, new Date(intialDate.getTime() + 90000))
          ]}
        />
      );

      // Now have 90 seconds of data, first data point should be dropped
      dataset = JSON.parse(lineChart.getAttribute("data-dataset") ?? "");
      expect(dataset.length).toBe(5);
      expect(dataset[0]["TEST:PV"]).toBe(20);
      expect(dataset[1]["TEST:PV"]).toBe(30);
      expect(dataset[2]["TEST:PV"]).toBe(40);
      expect(dataset[3]["TEST:PV"]).toBe(50);
      expect(dataset[4]["TEST:PV"]).toBe(60);
    });
  });

  describe("Styling", () => {
    test("applies tracetype to trace", () => {
      const traces = [new Trace({ traceType: 5, yPv: "TEST:PV" })];

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
      const traces = [new Trace({ pointType: 3, yPv: "TEST:PV" })];
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
