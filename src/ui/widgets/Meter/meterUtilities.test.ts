import { describe, it, expect } from "vitest";
import {
  NumberFormatEnum,
  convertInfAndNanToUndefined,
  formatValue,
  buildSubArcs,
  createIntervals
} from "./meterUtilities";

describe("convertInfAndNanToUndefined", () => {
  it("should return the same value for finite numbers", () => {
    expect(convertInfAndNanToUndefined(42)).toBe(42);
    expect(convertInfAndNanToUndefined(0)).toBe(0);
    expect(convertInfAndNanToUndefined(-10.5)).toBe(-10.5);
  });

  it("should return undefined for null or undefined", () => {
    expect(convertInfAndNanToUndefined(undefined)).toBeUndefined();
    expect(
      convertInfAndNanToUndefined(null as unknown as undefined)
    ).toBeUndefined();
  });

  it("should return undefined for Infinity and NaN", () => {
    expect(convertInfAndNanToUndefined(Infinity)).toBeUndefined();
    expect(convertInfAndNanToUndefined(-Infinity)).toBeUndefined();
    expect(convertInfAndNanToUndefined(NaN)).toBeUndefined();
  });
});

describe("formatValue", () => {
  it("should format values with default format", () => {
    const formatter = formatValue(123.456, NumberFormatEnum.Default, 2, "V");
    expect(formatter()).toBe("123");

    const formatterWithUnits = formatValue(
      123.456,
      NumberFormatEnum.Default,
      2,
      "V",
      true
    );
    expect(formatterWithUnits()).toBe("123 V");
  });

  it("should format values with default format, over different orders of magnitude", () => {
    const formatter1 = formatValue(1234.56, NumberFormatEnum.Default, 2, "V");
    expect(formatter1()).toBe("1235");

    const formatter2 = formatValue(12.3456, NumberFormatEnum.Default, 2, "V");
    expect(formatter2()).toBe("12");

    const formatter3 = formatValue(12345.6, NumberFormatEnum.Default, 2, "V");
    expect(formatter3()).toBe("1.2e+4");

    const formatter4 = formatValue(0.0123456, NumberFormatEnum.Default, 2, "V");
    expect(formatter4()).toBe("0.012");

    const formatter5 = formatValue(
      0.000000123456,
      NumberFormatEnum.Default,
      2,
      "V"
    );
    expect(formatter5()).toBe("1.2e-7");

    const formatter9 = formatValue(-12345.6, NumberFormatEnum.Default, 2, "V");
    expect(formatter9()).toBe("-1.2e+4");

    const formatter6 = formatValue(-1234.56, NumberFormatEnum.Default, 2, "V");
    expect(formatter6()).toBe("-1235");

    const formatter7 = formatValue(-123.456, NumberFormatEnum.Default, 2, "V");
    expect(formatter7()).toBe("-123");

    const formatter8 = formatValue(-12.3456, NumberFormatEnum.Default, 2, "V");
    expect(formatter8()).toBe("-12");
  });

  it("should format values with exponential format", () => {
    const formatter = formatValue(
      123.456,
      NumberFormatEnum.Exponential,
      3,
      "V"
    );
    expect(formatter()).toBe("1.23e+2");

    const formatterWithUnits = formatValue(
      123.456,
      NumberFormatEnum.Exponential,
      3,
      "V",
      true
    );
    expect(formatterWithUnits()).toBe("1.23e+2 V");
  });

  it("should format values with engineering format", () => {
    const formatter = formatValue(
      123.456,
      NumberFormatEnum.Engineering,
      3,
      "V"
    );
    expect(formatter()).toBe("123");

    const formatter2 = formatValue(
      123.456,
      NumberFormatEnum.Engineering,
      4,
      "V"
    );
    expect(formatter2()).toBe("123.5");
  });

  it("should format values with hexadecimal format", () => {
    const formatter = formatValue(
      123.456,
      NumberFormatEnum.Hexadecimal,
      2,
      "V"
    );
    expect(formatter()).toBe("0x7b");

    const formatterWithUnits = formatValue(
      255,
      NumberFormatEnum.Hexadecimal,
      2,
      "V",
      true
    );
    expect(formatterWithUnits()).toBe("0xff V");
  });

  it("should use default precision when precision is -1", () => {
    const formatter = formatValue(123.456, NumberFormatEnum.Default, -1, "V");
    expect(formatter()).toBe("123");
  });
});

describe("buildSubArcs", () => {
  it("should build sub arcs with all ranges defined", () => {
    const subArcs = buildSubArcs("blue", 0, 100, 10, 20, 80, 90);

    expect(subArcs).toHaveLength(5);
    expect(subArcs[0].limit).toBe(10);
    expect(subArcs[0].color).toBe("rgba(255, 0, 0, 1)");

    expect(subArcs[1].limit).toBe(20);
    expect(subArcs[1].color).toBe("rgba(255, 128, 0, 1)");

    expect(subArcs[2].limit).toBe(80);
    expect(subArcs[2].color).toBe("blue");

    expect(subArcs[3].limit).toBe(90);
    expect(subArcs[3].color).toBe("rgba(255, 128, 0, 1)");

    expect(subArcs[4].limit).toBe(100);
    expect(subArcs[4].color).toBe("rgba(255, 0, 0, 1)");
  });

  it("should build sub arcs with only warning ranges", () => {
    const subArcs = buildSubArcs("green", 0, 100, undefined, 20, 80, undefined);

    expect(subArcs).toHaveLength(3);
    expect(subArcs[0].limit).toBe(20);
    expect(subArcs[0].color).toBe("rgba(255, 128, 0, 1)");

    expect(subArcs[1].limit).toBe(80);
    expect(subArcs[1].color).toBe("green");

    expect(subArcs[2].limit).toBe(100);
    expect(subArcs[2].color).toBe("rgba(255, 128, 0, 1)");
  });

  it("should build sub arcs with only alarm ranges", () => {
    const subArcs = buildSubArcs("red", 0, 100, 10, undefined, undefined, 90);

    expect(subArcs).toHaveLength(3);
    expect(subArcs[0].limit).toBe(10);
    expect(subArcs[0].color).toBe("rgba(255, 0, 0, 1)");

    expect(subArcs[1].limit).toBe(90);
    expect(subArcs[1].color).toBe("red");

    expect(subArcs[2].limit).toBe(100);
    expect(subArcs[2].color).toBe("rgba(255, 0, 0, 1)");
  });

  it("should build sub arcs when low value alarm range greater then low value warning range", () => {
    const subArcs = buildSubArcs("green", 0, 100, 20, 10, 80, 90);

    expect(subArcs).toHaveLength(4);
    expect(subArcs[0].limit).toBe(20);
    expect(subArcs[0].color).toBe("rgba(255, 0, 0, 1)");

    expect(subArcs[1].limit).toBe(80);
    expect(subArcs[1].color).toBe("green");

    expect(subArcs[2].limit).toBe(90);
    expect(subArcs[2].color).toBe("rgba(255, 128, 0, 1)");

    expect(subArcs[3].limit).toBe(100);
    expect(subArcs[3].color).toBe("rgba(255, 0, 0, 1)");
  });

  it("should build sub arcs when high value alarm range lower than high value warning range", () => {
    const subArcs = buildSubArcs("green", 0, 100, 10, 20, 80, 70);

    expect(subArcs).toHaveLength(4);
    expect(subArcs[0].limit).toBe(10);
    expect(subArcs[0].color).toBe("rgba(255, 0, 0, 1)");

    expect(subArcs[1].limit).toBe(20);
    expect(subArcs[1].color).toBe("rgba(255, 128, 0, 1)");

    expect(subArcs[2].limit).toBe(70);
    expect(subArcs[2].color).toBe("green");

    expect(subArcs[3].limit).toBe(100);
    expect(subArcs[3].color).toBe("rgba(255, 0, 0, 1)");
  });

  it("should build sub arcs with no ranges", () => {
    const subArcs = buildSubArcs(
      "purple",
      0,
      100,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(subArcs).toHaveLength(1);
    expect(subArcs[0].limit).toBe(100);
    expect(subArcs[0].color).toBe("purple");
  });

  it("should clamp values to min/max bounds", () => {
    const subArcs = buildSubArcs("blue", 50, 150, 0, 60, 160, 200);

    expect(subArcs[0].limit).toBe(60); // upper limit of low value alarm range
    expect(subArcs[2].limit).toBe(150); // Maximum value
  });
});

describe("createIntervals", () => {
  it("should create intervals between min and max values", () => {
    const intervals = createIntervals(0, 100);
    expect(intervals.length).toBe(11);
    expect(intervals.length).toBeLessThanOrEqual(16);
    expect(intervals[0]).toBe(0);
    expect(intervals[intervals.length - 1]).toBe(100);
  });

  it("should create intervals for decimal ranges", () => {
    const intervals = createIntervals(0.1, 0.9);
    expect(intervals.length).toBe(9);
    expect(intervals.length).toBeLessThanOrEqual(16);
    expect(intervals[0]).toBe(0.1);
    expect(intervals[intervals.length - 1]).toBe(0.9);
  });

  it("should create intervals for negative ranges", () => {
    const intervals = createIntervals(-100, -10);
    expect(intervals.length).toBe(10);
    expect(intervals.length).toBeLessThanOrEqual(16);
    expect(intervals[0]).toBe(-100);
    expect(intervals[intervals.length - 1]).toBe(-10);
  });

  it("should create intervals for mixed ranges", () => {
    const intervals = createIntervals(-50, 50);
    expect(intervals.length).toBe(11);
    expect(intervals.length).toBeLessThanOrEqual(16);
    expect(intervals[0]).toBe(-50);
    expect(intervals[intervals.length - 1]).toBe(50);
  });

  it("should handle very small ranges", () => {
    const intervals = createIntervals(1, 1.0001);
    expect(intervals.length).toBe(11);
    expect(intervals[0]).toBe(1);
    expect(intervals[intervals.length - 1]).toBe(1.0001);
  });

  it("should throw error when min is greater than or equal to max", () => {
    expect(() => createIntervals(10, 5)).toThrow(
      "Minimum value must be less than maximum value"
    );
    expect(() => createIntervals(5, 5)).toThrow(
      "Minimum value must be less than maximum value"
    );
  });

  it("should handle very large ranges", () => {
    const intervals = createIntervals(0, 1000000);
    expect(intervals.length).toBe(11);
    expect(intervals.length).toBeLessThanOrEqual(16);
    expect(intervals[0]).toBe(0);
    expect(intervals[intervals.length - 1]).toBe(1000000);
  });

  it("should handle very small exponential ranges", () => {
    const intervals = createIntervals(1.0e-12, 1.0e9);
    expect(intervals.length).toBe(11);
    expect(intervals[0]).toBe(0); // note non-log scale
    expect(intervals[intervals.length - 1]).toBe(1.0e9);
  });

  it("should create intervals of spacing 0.5, when the range is 6", () => {
    const intervals = createIntervals(20, 26);
    expect(intervals.length).toBe(13);
    expect(intervals[0]).toBe(20);
    expect(intervals[intervals.length - 1]).toBe(26);
  });

  it("should create intervals of spacing 1, when the range is 7", () => {
    const intervals = createIntervals(20, 27);
    expect(intervals.length).toBe(8);
    expect(intervals[0]).toBe(20);
    expect(intervals[intervals.length - 1]).toBe(27);
  });

  it("should create intervals of spacing 2 when the range is 16", () => {
    const intervals = createIntervals(10, 26);
    expect(intervals.length).toBe(9);
    expect(intervals[0]).toBe(10);
    expect(intervals[intervals.length - 1]).toBe(26);
  });

  it("should create intervals of spacing 2.5 when the range is 25", () => {
    const intervals = createIntervals(10, 35);
    expect(intervals.length).toBe(11);
    expect(intervals[0]).toBe(10);
    expect(intervals[intervals.length - 1]).toBe(35);
  });

  it("should create intervals of spacing 5 when the range is 45", () => {
    const intervals = createIntervals(10, 55);
    expect(intervals.length).toBe(10);
    expect(intervals[0]).toBe(10);
    expect(intervals[intervals.length - 1]).toBe(55);
  });

  it("should create intervals of spacing 10 when the range is 90", () => {
    const intervals = createIntervals(10, 100);
    expect(intervals.length).toBe(10);
    expect(intervals[0]).toBe(10);
    expect(intervals[intervals.length - 1]).toBe(100);
  });

  it("should create intervals of spacing 20 when the range is 160", () => {
    const intervals = createIntervals(10, 170);
    expect(intervals.length).toBe(10);
    expect(intervals[0]).toBe(10);
    expect(intervals[intervals.length - 1]).toBe(170);
  });
});
