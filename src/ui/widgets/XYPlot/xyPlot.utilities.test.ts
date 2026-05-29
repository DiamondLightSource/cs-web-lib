import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildMarkerDataSet,
  buildPlotDataSet,
  buildSeries,
  buildXAxes,
  buildYAxes
} from "./xyPlot.utilities";

import { Trace } from "../../../types/trace";
import { Axis } from "../../../types/axis";

vi.mock("../../../types/dtypes", () => ({
  dTypeCoerceArray: vi.fn(val => val),
  dTypeCoerceDouble: vi.fn(val => Number(val))
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

describe("buildMarkerDataSet", () => {
  it("builds marker dataset from pvData", () => {
    const pvData = [
      { effectivePvName: "sensor.marker1", value: 10 },
      { effectivePvName: "sensor.marker2", value: 20 }
    ] as any;

    const markers = [
      {
        pvName: "marker1",
        visible: true,
        color: { colorString: "red" }
      },
      {
        pvName: "marker2",
        visible: true,
        color: { colorString: "blue" }
      }
    ] as any;

    const result = buildMarkerDataSet(pvData, markers);

    expect(result).toEqual([
      {
        pvName: "marker1",
        visible: true,
        color: { colorString: "red" },
        pvValue: 10
      },
      {
        pvName: "marker2",
        visible: true,
        color: { colorString: "blue" },
        pvValue: 20
      }
    ]);
  });

  it("returns empty array when no markers provided", () => {
    const result = buildMarkerDataSet([], []);
    expect(result).toEqual([]);
  });

  it("returns empty array when markers is undefined", () => {
    const result = buildMarkerDataSet([], undefined as any);
    expect(result).toEqual([]);
  });

  it("handles marker with no matching pvData", () => {
    const pvData = [{ effectivePvName: "sensor.other", value: 10 }] as any;

    const markers = [
      { pvName: "marker1", visible: true, color: { colorString: "red" } }
    ] as any;

    const result = buildMarkerDataSet(pvData, markers);

    expect(result).toEqual([
      {
        pvName: "marker1",
        visible: true,
        color: { colorString: "red" },
        pvValue: undefined
      }
    ]);
  });

  it("filters out null markers", () => {
    const pvData = [{ effectivePvName: "sensor.marker1", value: 10 }] as any;

    const markers = [
      null,
      { pvName: "marker1", visible: true, color: { colorString: "red" } },
      undefined
    ] as any;

    const result = buildMarkerDataSet(pvData, markers);

    expect(result).toHaveLength(1);
    expect(result[0].pvName).toBe("marker1");
  });

  it("filters out markers without pvName", () => {
    const pvData = [{ effectivePvName: "sensor.marker1", value: 10 }] as any;

    const markers = [
      { visible: true, color: { colorString: "red" } }, // no pvName
      { pvName: "marker1", visible: true, color: { colorString: "blue" } }
    ] as any;

    const result = buildMarkerDataSet(pvData, markers);

    expect(result).toHaveLength(1);
    expect(result[0].pvName).toBe("marker1");
  });

  it("handles pvData with null value", () => {
    const pvData = [{ effectivePvName: "sensor.marker1", value: null }] as any;

    const markers = [
      { pvName: "marker1", visible: true, color: { colorString: "red" } }
    ] as any;

    const result = buildMarkerDataSet(pvData, markers);

    expect(result[0].pvValue).toBeUndefined();
  });

  it("uses endsWith matching for pvName", () => {
    const pvData = [
      { effectivePvName: "prefix.sensor.marker1", value: 10 }
    ] as any;

    const markers = [
      { pvName: "marker1", visible: true, color: { colorString: "red" } }
    ] as any;

    const result = buildMarkerDataSet(pvData, markers);

    expect(result[0].pvValue).toBe(10);
  });
});

describe("buildPlotDataSet", () => {
  const baseTraces = [
    {
      yPv: "a",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 1
    } as Trace,
    {
      yPv: "b",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 1
    } as Trace
  ];

  it("builds dataset aligned by shortest series", () => {
    const pvData = [
      { effectivePvName: "a", value: [1, 2, 3] },
      { effectivePvName: "b", value: [10, 20] }
    ] as any;

    const result = buildPlotDataSet(pvData, baseTraces);

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

    const result = buildPlotDataSet(pvData, baseTraces);

    expect(result).toEqual([{ b: 1 }, { b: 2 }]);
  });

  it("returns empty array when no valid data", () => {
    expect(buildPlotDataSet([], baseTraces)).toEqual([]);
  });

  it("coerces values to numbers", () => {
    const pvData = [{ effectivePvName: "a", value: ["1", "2"] }] as any;

    const result = buildPlotDataSet(pvData, baseTraces);

    expect(result).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("ignores entries with missing effectivePvName", () => {
    const pvData = [
      { value: [1, 2] }, // invalid
      { effectivePvName: "a", value: [3, 4] }
    ] as any;

    const result = buildPlotDataSet(pvData, baseTraces);

    expect(result).toEqual([{ a: 3 }, { a: 4 }]);
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

  it("applies marker shape correctly", () => {
    const trace = {
      ...baseTrace,
      pointType: 3 // diamond
    };

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).toMatchObject({
      shape: "diamond"
    });
  });

  it("uses default label when name is missing", () => {
    const trace = { ...baseTrace, name: "" };

    const result = buildSeries([trace], pvData, true);

    expect(result[0].label).toBe("Series 1");
  });

  it("sets yAxisId correctly", () => {
    const trace = { ...baseTrace, axis: 2 };

    const result = buildSeries([trace], pvData, true);

    expect(result[0].yAxisId).toBe("2");
  });

  it("filters out null traces", () => {
    const pvData = [
      { effectivePvName: "sensor.temp" },
      { effectivePvName: "sensor.pressure" }
    ] as any;

    const traces = [
      {
        yPv: "temp",
        name: "Temp",
        color: { colorString: "red" },
        pointType: 1,
        traceType: 1
      },
      null,
      {
        yPv: "pressure",
        name: "Pressure",
        color: { colorString: "blue" },
        pointType: 1,
        traceType: 1
      },
      undefined
    ] as any;

    const result = buildSeries(traces, pvData, true);

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Temp");
    expect(result[1].label).toBe("Pressure");
  });

  it("hides marks when pointType is 0", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;
    const trace = {
      yPv: "temp",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 0,
      traceType: 1
    } as any;

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).toMatchObject({
      showMark: false
    });
  });

  it("handles multiple traces with different types", () => {
    const pvData = [
      { effectivePvName: "sensor.temp" },
      { effectivePvName: "sensor.pressure" }
    ] as any;

    const traces = [
      {
        yPv: "temp",
        name: "Temp",
        color: { colorString: "red" },
        pointType: 1,
        traceType: 1 // line
      },
      {
        yPv: "pressure",
        name: "Pressure",
        color: { colorString: "blue" },
        pointType: 0,
        traceType: 5 // bar
      }
    ] as any;

    const result = buildSeries(traces, pvData, true);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("line");
    expect(result[1].type).toBe("bar");
  });

  it("uses linear curve by default", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;
    const trace = {
      yPv: "temp",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 1
    } as any;

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).toMatchObject({
      curve: "linear"
    });
  });

  it("sets connectNulls to false", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;
    const trace = {
      yPv: "temp",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 1
    } as any;

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).toMatchObject({
      connectNulls: false
    });
  });

  it("applies all marker shapes correctly", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;

    const markerShapes = [
      { pointType: 0, expected: undefined },
      { pointType: 1, expected: "square" },
      { pointType: 2, expected: "circle" },
      { pointType: 3, expected: "diamond" },
      { pointType: 4, expected: "cross" },
      { pointType: 5, expected: "triangle" }
    ];

    markerShapes.forEach(({ pointType, expected }) => {
      const trace = {
        yPv: "temp",
        name: "Temp",
        color: { colorString: "red" },
        pointType,
        traceType: 1
      } as any;

      const result = buildSeries([trace], pvData, true);

      expect(result[0]).toMatchObject({
        shape: expected
      });
    });
  });

  it("filters traces when effectivePvName doesn't match any pvData", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;

    const traces = [
      {
        yPv: "temp",
        name: "Temp",
        color: { colorString: "red" },
        pointType: 1,
        traceType: 1
      },
      {
        yPv: "humidity", // This doesn't match any pvData
        name: "Humidity",
        color: { colorString: "blue" },
        pointType: 1,
        traceType: 1
      }
    ] as any;

    const result = buildSeries(traces, pvData, true);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Temp");
  });

  it("handles endsWith matching for yPv", () => {
    const pvData = [{ effectivePvName: "prefix.long.path.sensor.temp" }] as any;

    const trace = {
      yPv: "temp",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 1
    } as any;

    const result = buildSeries([trace], pvData, true);

    expect(result).toHaveLength(1);
    expect(result[0].dataKey).toBe("prefix.long.path.sensor.temp");
  });

  it("assigns correct series ID", () => {
    const pvData = [
      { effectivePvName: "sensor.temp" },
      { effectivePvName: "sensor.pressure" }
    ] as any;

    const traces = [
      {
        yPv: "temp",
        name: "Temp",
        color: { colorString: "red" },
        pointType: 1,
        traceType: 1
      },
      {
        yPv: "pressure",
        name: "Pressure",
        color: { colorString: "blue" },
        pointType: 1,
        traceType: 1
      }
    ] as any;

    const result = buildSeries(traces, pvData, true);

    expect(result[0].id).toBe("0");
    expect(result[1].id).toBe("1");
  });

  it("sets labelMarkType to line for line series", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;
    const trace = {
      yPv: "temp",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 1
    } as any;

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).toMatchObject({
      labelMarkType: "line"
    });
  });

  it("does not include labelMarkType for bar series", () => {
    const pvData = [{ effectivePvName: "sensor.temp" }] as any;
    const trace = {
      yPv: "temp",
      name: "Temp",
      color: { colorString: "red" },
      pointType: 1,
      traceType: 5
    } as any;

    const result = buildSeries([trace], pvData, true);

    expect(result[0]).not.toHaveProperty("labelMarkType");
    expect(result[0]).not.toHaveProperty("curve");
    expect(result[0]).not.toHaveProperty("showMark");
  });
});

describe("buildXAxes", () => {
  const style = { colors: { color: "black" } } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds axis from trace with pv min/max", () => {
    const traces = [{ xPv: "time", axis: 0, traceType: 1 }] as any;
    const xAxis = {
      title: "X title",
      color: { colorString: "red" },
      autoscale: false,
      onRight: false,
      logScale: false,
      minimum: 0,
      maximum: 100
    } as Axis;

    const result = buildXAxes(traces, style, xAxis);

    expect(result.xAxis[0]).toMatchObject({
      dataKey: "time",
      min: 0,
      max: 100,
      scaleType: "linear"
    });
    expect(result.hasXAxisData).toBe(true);
  });

  it("defaults dataKey to x when none provided", () => {
    const result = buildXAxes(
      [],
      { colors: { color: "black" } } as any,
      {} as any
    );

    expect(result.xAxis[0].dataKey).toBe("x");
    expect(result.hasXAxisData).toBe(false);
  });

  it("uses band scale for bar charts", () => {
    const traces = [{ traceType: 5 }] as any;
    const mockStyle = {
      colors: { color: "black" }
    } as any;

    const result = buildXAxes(traces, mockStyle, {} as any);

    expect(result.xAxis[0].scaleType).toBe("band");
  });

  it("uses symlog scale when logScale is true", () => {
    const traces = [{ xPv: "time", traceType: 1 }] as any;
    const xAxis = {
      title: "X",
      logScale: true,
      autoscale: true
    } as any;

    const result = buildXAxes(traces, style, xAxis);

    expect(result.xAxis[0].scaleType).toBe("symlog");
  });

  it("does not apply min/max when autoscale is true", () => {
    const traces = [{ xPv: "time", traceType: 1 }] as any;
    const xAxis = {
      title: "X",
      autoscale: true,
      minimum: 0,
      maximum: 100
    } as any;

    const result = buildXAxes(traces, style, xAxis);

    expect(result.xAxis[0].min).toBeUndefined();
    expect(result.xAxis[0].max).toBeUndefined();
  });

  it("ignores non-finite min/max values", () => {
    const traces = [{ xPv: "time", traceType: 1 }] as any;
    const xAxis = {
      title: "X",
      autoscale: false,
      minimum: Infinity,
      maximum: -Infinity
    } as any;

    const result = buildXAxes(traces, style, xAxis);

    expect(result.xAxis[0].min).toBeUndefined();
    expect(result.xAxis[0].max).toBeUndefined();
  });

  it("uses first trace with xPv when multiple exist", () => {
    const traces = [
      { xPv: "time1", traceType: 1 },
      { xPv: "time2", traceType: 1 }
    ] as any;
    const xAxis = {} as any;

    const result = buildXAxes(traces, style, xAxis);

    expect(result.xAxis[0].dataKey).toBe("time1");
  });

  it("applies axis label from xAxisDefinition", () => {
    const traces = [{ xPv: "time", traceType: 1 }] as any;
    const xAxis = {
      title: "Time (seconds)"
    } as any;

    const result = buildXAxes(traces, style, xAxis);

    expect(result.xAxis[0].label).toBe("Time (seconds)");
  });

  it("handles undefined traces", () => {
    const result = buildXAxes(undefined, style, {} as any);

    expect(result.xAxis[0].dataKey).toBe("x");
    expect(result.hasXAxisData).toBe(false);
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

    expect(
      result.yAxesStyle['& .MuiChartsAxis-root[data-axis-id="0"]']
    ).toBeDefined();
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

  it("propagates visible flag", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        visible: false,
        autoscale: true,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].visible).toBe(false);
  });

  it("applies font styles", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        titleFont: {},
        scaleFont: {},
        autoscale: true,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].labelStyle).toBeDefined();
    expect(result.yAxes[0].tickLabelStyle).toBeDefined();
  });

  it("handles multiple axes", () => {
    const axes = [
      {
        title: "Y1",
        color: { colorString: "red" },
        autoscale: true,
        onRight: false,
        logScale: false
      },
      {
        title: "Y2",
        color: { colorString: "blue" },
        autoscale: true,
        onRight: true,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes).toHaveLength(2);
    expect(result.yAxes[0].position).toBe("left");
    expect(result.yAxes[1].position).toBe("right");
  });

  it("formats small values in exponential notation", () => {
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

    expect(formatter(0.0001, { location: "tick" })).toMatch(/e/);
    expect(formatter(0.001, { location: "tick" })).toBe("0.001");
  });

  it("formats negative values correctly", () => {
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

    expect(formatter(-5, { location: "tooltip" })).toBe("-5");
    expect(formatter(-10000, { location: "tick" })).toMatch(/-.*e/);
  });

  it("handles equal min and max (creates invalid range)", () => {
    const axes = [
      {
        title: "Y",
        color: { colorString: "black" },
        autoscale: false,
        minimum: 5,
        maximum: 5,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].min).toBeUndefined();
    expect(result.yAxes[0].max).toBeUndefined();
  });

  it("sets correct axis IDs", () => {
    const axes = [
      {
        title: "Y1",
        color: { colorString: "red" },
        autoscale: true,
        onRight: false,
        logScale: false
      },
      {
        title: "Y2",
        color: { colorString: "blue" },
        autoscale: true,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(result.yAxes[0].id).toBe("0");
    expect(result.yAxes[1].id).toBe("1");
  });

  it("creates style for each axis", () => {
    const axes = [
      {
        title: "Y1",
        color: { colorString: "red" },
        autoscale: true,
        onRight: false,
        logScale: false
      },
      {
        title: "Y2",
        color: { colorString: "blue" },
        autoscale: true,
        onRight: false,
        logScale: false
      }
    ] as any;

    const result = buildYAxes(axes);

    expect(
      result.yAxesStyle['& .MuiChartsAxis-root[data-axis-id="0"]']
    ).toBeDefined();
    expect(
      result.yAxesStyle['& .MuiChartsAxis-root[data-axis-id="1"]']
    ).toBeDefined();
  });
});
