import React from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { DataBrowserComponent } from "./dataBrowser";
import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";
import { Plt } from "../../../types/plt";
import { PvDatum } from "../../../redux/csState";
import { newDTime } from "../../../types/dtypes/dTime";
import { newDType } from "../../../types/dtypes/dType";
import { ColorUtils } from "../../../types/color";

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
  LineChart: vi.fn(({ series, xAxis, yAxis, dataset, sx }) => (
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

vi.mock("@mui/material", () => ({
  Box: vi.fn(({ children }) => <div data-testid="mui-box">{children}</div>),
  Typography: vi.fn(({ children }) => (
    <div data-testid="mui-typography">{children}</div>
  ))
}));

describe("DataBrowserComponent", () => {
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
      value: newDType({ doubleValue: value }, undefined, newDTime(date), {
        units: "mm",
        controlRange: { min: 0, max: 100 }
      })
    } as Partial<PvDatum> as PvDatum;
  };

  const defaultProps = {
    pvData: [buildPvDatum("TEST:PV", 50)],
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSuccessResponse: any = JSON.stringify([
    {
      secs: (new Date().getTime() - 250000) / 1000,
      val: 52
    },
    {
      secs: (new Date().getTime() - 200000) / 1000,
      val: 45
    },
    {
      secs: (new Date().getTime() - 70000) / 1000,
      val: 60
    }
  ]);
  const mockJsonPromise = Promise.resolve(
    JSON.parse(
      `[{"data": ${mockSuccessResponse}, "meta": { "name": "TEST:PV" }}]`
    )
  );
  const mockFetchPromise = Promise.resolve({
    json: (): Promise<unknown> => mockJsonPromise
  });
  const mockFetch = (): Promise<unknown> => mockFetchPromise;
  vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);

  describe("Rendering", () => {
    test("renders with default props", async () => {
      await act(async () => {
        render(<DataBrowserComponent {...defaultProps} />);
      });

      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();

      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");
      expect(yAxisData[0].position).toBe("left");
      expect(xAxisData[0].scaleType).toBe("time");
    });

    test("renders with 1 y axis on either side", async () => {
      const axes = [
        new Axis({ color: ColorUtils.RED }),
        new Axis({ color: ColorUtils.BLUE, onRight: true })
      ];
      const newProps = {
        ...defaultProps,
        plt: new Plt({ axes: axes })
      };
      await act(async () => {
        render(<DataBrowserComponent {...newProps} />);
      });

      const lineChart = screen.getByTestId("line-chart");
      const yAxisData = JSON.parse(lineChart.getAttribute("data-yaxis") ?? "");

      expect(yAxisData[0].color).toBe(ColorUtils.RED.colorString);
      expect(yAxisData[1].color).toBe(ColorUtils.BLUE.colorString);
      expect(yAxisData[1].position).toBe("right");
    });

    test("renders with 5 minute archived data", async () => {
      const newProps = {
        ...defaultProps,
        plt: new Plt({
          start: "5 min",
          end: "now",
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

      const { rerender } = await act(async () => {
        return render(<DataBrowserComponent {...newProps} />);
      });
      const lineChart = screen.getByTestId("line-chart");
      expect(lineChart).toBeDefined();
      const xAxisData = JSON.parse(lineChart.getAttribute("data-xaxis") ?? "");

      const expectedDiff = 300000; // 5 * 60 * 1000
      const actualDiff =
        new Date(xAxisData[0].max).getTime() -
        new Date(xAxisData[0].min).getTime();

      expect(actualDiff).toBe(expectedDiff);

      // Send a new value to append to archived data
      await act(async () => {
        rerender(
          <DataBrowserComponent
            {...newProps}
            pvData={[buildPvDatum("TEST:PV", 57)]}
          />
        );
      });
      const newLineChart = screen.getByTestId("line-chart");
      expect(newLineChart).toBeDefined();
      const seriesData = JSON.parse(
        newLineChart.getAttribute("data-series") ?? ""
      );

      const dataset = JSON.parse(
        newLineChart.getAttribute("data-dataset") ?? ""
      );

      expect(dataset.length).toBe(4);
      expect(dataset[0]["ca://TEST:PV"]).toBe(52);
      expect(seriesData[0].dataKey).toBe("TEST:PV");
    });
  });
});
