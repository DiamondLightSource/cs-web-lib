import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildPlotDataSet,
  buildSeries,
  buildXAxes,
  buildYAxes
} from "./xyPlot.utilities";

import { getPvValueByPvName } from "../utils";
import { Trace } from "../../../types/trace";

vi.mock("../../../types/dtypes", () => ({
  dTypeCoerceArray: vi.fn(val => val)
}));

vi.mock("../utils", () => ({
  getPvValueByPvName: vi.fn()
}));

vi.mock("../../../types/axis", () => ({
  newAxis: vi.fn(() => ({
    title: "Default",
    color: { colorString: "blue" },
    autoscale: true,
    onRight: false,
    logScale: false
  }))
}));

vi.mock("../../../types/font", () => ({
  fontToCss: vi.fn(() => ({}))
}));

describe("buildPlotDataSet", () => {
  it("builds dataset aligned by shortest series", () => {
    const pvData = [
      { effectivePvName: "a", value: [1, 2, 3] },
      { effectivePvName: "b", value: [10, 20] }
    ] as any;

    const result = buildPlotDataSet(pvData);

    expect(result).toEqual([
      { a: 1, b: 10 },
      { a: 2, b: 20 }
    ]);
  });

  it("filters invalid data", () => {
    const pvData = [
      null,
      { effectivePvName: "a", value: [] },
      { effectivePvName: "b", value: [1, 2] }
    ] as any;

    const result = buildPlotDataSet(pvData);

    expect(result).toEqual([{ b: 1 }, { b: 2 }]);
  });

  it("returns empty array when no valid data", () => {
    expect(buildPlotDataSet([])).toEqual([]);
  });
});

describe("buildSeries", () => {
  const pvData = [{ effectivePvName: "sensor.temp" }] as any;

  const baseTrace = {
    yPv: "temp",
    name: "Temp",
    color: { colorString: "red" },
    pointType: 1,
    traceType: 1
  } as Trace;

  it("builds line series", () => {
    const result = buildSeries([baseTrace], pvData, true);

    expect(result[0]).toMatchObject({
      type: "line",
      dataKey: "sensor.temp",
      label: "Temp",
      color: "red",
      showMark: true
    });
  });

  it("builds bar series", () => {
    const trace = { ...baseTrace, traceType: 5 };

    const result = buildSeries([trace], pvData, true);

    expect(result[0].type).toBe("bar");
  });

  it("uses transparent color when not visible", () => {
    const result = buildSeries([baseTrace], pvData, false);

    expect(result[0].color).toBe("transparent");
  });

  it("returns empty when no matching pv name", () => {
    const result = buildSeries([baseTrace], [], true);

    expect(result).toEqual([]);
  });

  it("applies step curve for traceType=2", () => {
    const trace = { ...baseTrace, traceType: 2 };

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).toMatchObject({
      curve: "stepAfter"
    });
  });

  it("handles undefined traces (fallback)", () => {
    const result = buildSeries(undefined, [], true);
    expect(result).toBeDefined();
  });
});

describe("buildXAxes", () => {
  const style = { colors: { color: "black" } } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds axis from trace with pv min/max", () => {
    (getPvValueByPvName as any).mockReturnValue({
      value: {
        display: {
          controlRange: { min: 0, max: 100 }
        }
      }
    });

    const traces = [{ xPv: "time", axis: 0, traceType: 1 }] as any;

    const result = buildXAxes(traces, style, []);

    expect(result.xAxis[0]).toMatchObject({
      dataKey: "time",
      min: 0,
      max: 100,
      scaleType: "linear"
    });
    expect(result.hasXAxisData).toBe(true);
  });

  it("deduplicates axes by axisId", () => {
    (getPvValueByPvName as any).mockReturnValue({ value: {} });

    const traces = [
      { xPv: "time", axis: 0, traceType: 1 },
      { xPv: "time2", axis: 0, traceType: 1 }
    ] as any;

    const result = buildXAxes(traces, style, []);

    expect(result.xAxis.length).toBe(1);
  });

  it("uses default axis when none exist", () => {
    const result = buildXAxes([], style, []);

    expect(result.hasXAxisData).toBe(false);
    expect(result.xAxis[0]).toMatchObject({
      dataKey: "x",
      scaleType: "band"
    });
  });
});

describe("buildYAxes", () => {
  it("creates axis with styles", () => {
    const axes = [
      {
        title: "Y1",
        color: { colorString: "red" },
        autoscale: true,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0]).toMatchObject({
      label: "Y1",
      color: "red",
      position: "left"
    });

    expect(result.yAxesStyle[".MuiChartsAxis-id-0"]).toBeDefined();
  });

  it("applies min/max when valid", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        autoscale: false,
        minimum: 0,
        maximum: 10,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].min).toBe(0);
    expect(result.yAxes[0].max).toBe(10);
  });

  it("removes invalid min/max range", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        autoscale: false,
        minimum: 10,
        maximum: 5,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].min).toBeUndefined();
    expect(result.yAxes[0].max).toBeUndefined();
  });

  it("formats values correctly", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        autoscale: true,
        onRight: false,
        logScale: false
      }
    ] as any;

    const { yAxes } = buildYAxes(axes);
    const formatter = yAxes[0].valueFormatter;

    expect(formatter(null, {})).toBe("");
    expect(formatter(NaN, {})).toBe("");
    expect(formatter(5, { location: "tooltip" })).toBe("5");
    expect(formatter(10000, { location: "tick" })).toMatch(/e/);
  });

  it("uses log scale and right position", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        autoscale: true,
        onRight: true,
        logScale: true
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].scaleType).toBe("symlog");
    expect(result.yAxes[0].position).toBe("right");
  });

  it("uses default axis when none provided", () => {
    const result = buildYAxes([] as any);

    expect(result.yAxes.length).toBe(1);
    expect(result.yAxes[0].label).toBe("Default");
  });
});
