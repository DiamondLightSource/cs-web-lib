import { Axis } from "./axis";
import { Color } from "./color";
import { Font } from "./font";
import { Plt } from "./plt";
import { Trace } from "./trace";

describe("Plt", () => {
  it("constructs the plt with values", (): void => {
    const testValues = {
      title: "Testing",
      axes: [new Axis(), new Axis({ color: Color.RED })],
      pvlist: [new Trace({ yPv: "TEST" })],
      background: Color.WHITE,
      foreground: Color.RED,
      scroll: false,
      grid: true,
      scrollStep: 5,
      updatePeriod: 10,
      bufferSize: 2000,
      titleFont: new Font(14),
      labelFont: new Font(8),
      legendFont: new Font(8),
      scaleFont: new Font(6),
      start: "10 minutes",
      end: "now"
    };
    const plt = new Plt(testValues);
    const actualValues = {
      title: "Testing",
      axes: [new Axis(), new Axis({ color: Color.RED })],
      pvlist: [new Trace({ yPv: "TEST" })],
      backgroundColor: Color.WHITE,
      foregroundColor: Color.RED,
      scroll: false,
      showGrid: true,
      scrollStep: 5,
      updatePeriod: 10,
      bufferSize: 2000,
      titleFont: new Font(14),
      labelFont: new Font(8),
      legendFont: new Font(8),
      scaleFont: new Font(6),
      start: "10 minutes",
      end: "now"
    };
    expect(plt).toEqual(actualValues);
    expect(plt).toBeInstanceOf(Plt);
  });

  it("construct the trace with only defaults", (): void => {
    const plt = new Plt();
    expect(plt).toEqual({
      axes: [new Axis()],
      pvlist: [new Trace()],
      title: "",
      backgroundColor: Color.WHITE,
      foregroundColor: Color.BLACK,
      scroll: true,
      showGrid: false,
      scrollStep: 5,
      updatePeriod: 0,
      bufferSize: 5000,
      titleFont: new Font(),
      labelFont: new Font(),
      legendFont: new Font(),
      scaleFont: new Font(),
      start: "1 minute",
      end: "now"
    });
    expect(plt).toBeInstanceOf(Plt);
  });
});
