import React from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { Color, DType } from "../../../types";
import { DataBrowserComponent } from "./dataBrowser";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";
import { Plt } from "../../../types/plt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Global {}
  }
}

interface GlobalFetch extends NodeJS.Global {
  fetch: any;
}
const globalWithFetch = global as GlobalFetch;

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

vi.mock("@mui/material", () => ({
  Box: vi.fn(({ children }) => <div data-testid="mui-box">{children}</div>),
  Typography: vi.fn(({ children }) => (
    <div data-testid="mui-typography">{children}</div>
  ))
}));

describe("DataBrowserComponent", () => {
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
    plt: new Plt({
      pvlist: [
        new Trace({
          archive: {
            name: "Primary",
            url: "http://archiver.diamond.ac.uk/retrieval"
          },
          yPv: "TEST:PV"
        })
      ],
      axes: [new Axis()]
    })
  };

  const mockSuccessResponse: any = JSON.stringify([
    {
      secs: new Date().getTime() - 250000,
      val: 52
    },
    {
      secs: new Date().getTime() - 200000,
      val: 45
    },
    {
      secs: new Date().getTime() - 70000,
      val: 60
    }
  ]);
  console.log(mockSuccessResponse);
  const mockJsonPromise = Promise.resolve(
    JSON.parse(`[{"data": ${mockSuccessResponse}}]`)
  );
  const mockFetchPromise = Promise.resolve({
    json: (): Promise<unknown> => mockJsonPromise
  });
  const mockFetch = (): Promise<unknown> => mockFetchPromise;
  vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders with default props", () => {
      render(<DataBrowserComponent {...defaultProps} />);

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();

      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");
      expect(yAxisData[0].position).toBe("left");
      expect(xAxisData[0].scaleType).toBe("time");
    });

    test("renders with 1 y axis on either side", () => {
      const axes = [
        new Axis({ color: Color.RED }),
        new Axis({ color: Color.BLUE, onRight: true })
      ];
      const newProps = {
        ...defaultProps,
        plt: new Plt({ axes: axes })
      };
      render(<DataBrowserComponent {...newProps} />);

      const lineChart = screen.getByTestId("line-chart");
      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");

      expect(yAxisData[0].color).toBe(Color.RED.toString());
      expect(yAxisData[1].color).toBe(Color.BLUE.toString());
      expect(yAxisData[1].position).toBe("right");
    });

    test("renders with 5 minute archived data", () => {
      const newProps = {
        ...defaultProps,
        plt: new Plt({ start: "5 min", end: "now" })
      };
      act(() => {
        render(<DataBrowserComponent {...newProps} />);
      });
      const lineChart = screen.getByTestId("line-chart");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");

      const expectedDiff = 300000; // 5 * 60 * 1000
      const actualDiff =
        new Date(xAxisData[0].max).getTime() -
        new Date(xAxisData[0].min).getTime();

      const seriesData = JSON.parse(
        lineChart.getAttribute("data-series") ?? ""
      );

      expect(actualDiff).toBe(expectedDiff);
      //expect(seriesData[0].data).toBe([52, 45, 60, 50]);
    });
  });
});
