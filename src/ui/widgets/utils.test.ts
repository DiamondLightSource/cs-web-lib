import { describe, it, expect } from "vitest";
import { parseCssPositionValue, parseToPixelInt } from "./utils";

describe("parseCssPositionValue", () => {
  const DEFAULT = 10;

  it("returns px when value is a number", () => {
    expect(parseCssPositionValue(20 as any, DEFAULT)).toEqual({
      value: 20,
      unit: "px"
    });

    expect(parseCssPositionValue(-5 as any, DEFAULT)).toEqual({
      value: -5,
      unit: "px"
    });
  });

  it("returns default value when value is not a string or number", () => {
    expect(parseCssPositionValue(null as any, DEFAULT)).toEqual({
      value: DEFAULT,
      unit: "px"
    });

    expect(parseCssPositionValue(undefined as any, DEFAULT)).toEqual({
      value: DEFAULT,
      unit: "px"
    });

    expect(parseCssPositionValue({} as any, DEFAULT)).toEqual({
      value: DEFAULT,
      unit: "px"
    });
  });

  it("parses numeric string and defaults unit to px", () => {
    expect(parseCssPositionValue("100", DEFAULT)).toEqual({
      value: 100,
      unit: "px"
    });

    expect(parseCssPositionValue("  25  ", DEFAULT)).toEqual({
      value: 25,
      unit: "px"
    });

    expect(parseCssPositionValue("-5", DEFAULT)).toEqual({
      value: -5,
      unit: "px"
    });
  });

  it("parses numeric string with css unit", () => {
    expect(parseCssPositionValue("200px", DEFAULT)).toEqual({
      value: 200,
      unit: "px"
    });

    expect(parseCssPositionValue("50%", DEFAULT)).toEqual({
      value: 50,
      unit: "%"
    });

    expect(parseCssPositionValue("2.5rem", DEFAULT)).toEqual({
      value: 2.5,
      unit: "rem"
    });

    expect(parseCssPositionValue("1.25em", DEFAULT)).toEqual({
      value: 1.25,
      unit: "em"
    });
  });

  it("returns default value for invalid css strings", () => {
    expect(parseCssPositionValue("auto", DEFAULT)).toEqual({
      value: DEFAULT,
      unit: "px"
    });

    expect(parseCssPositionValue("calc(100%)", DEFAULT)).toEqual({
      value: DEFAULT,
      unit: "px"
    });

    expect(parseCssPositionValue("px10", DEFAULT)).toEqual({
      value: DEFAULT,
      unit: "px"
    });
  });
});

describe("parseToPixelInt", () => {
  const DEFAULT = 0;

  it("returns the number unchanged when value is a number", () => {
    expect(parseToPixelInt(10, DEFAULT)).toBe(10);
    expect(parseToPixelInt(-5, DEFAULT)).toBe(-5);
  });

  it("parses numeric string", () => {
    expect(parseToPixelInt("10", DEFAULT)).toBe(10);
    expect(parseToPixelInt("  25  ", DEFAULT)).toBe(25);
    expect(parseToPixelInt("-5", DEFAULT)).toBe(-5);
  });

  it("parses numeric string suffixed with px", () => {
    expect(parseToPixelInt("10px", DEFAULT)).toBe(10);
    expect(parseToPixelInt("-5px", DEFAULT)).toBe(-5);
  });

  it("returns default value for invalid strings", () => {
    expect(parseToPixelInt("10%", DEFAULT)).toBe(DEFAULT);
    expect(parseToPixelInt("10em", DEFAULT)).toBe(DEFAULT);
    expect(parseToPixelInt("px10", DEFAULT)).toBe(DEFAULT);
    expect(parseToPixelInt("10.5px", DEFAULT)).toBe(DEFAULT);
    expect(parseToPixelInt("abc", DEFAULT)).toBe(DEFAULT);
  });

  it("returns default value for non-string and non-number values", () => {
    expect(parseToPixelInt(null as any, DEFAULT)).toBe(DEFAULT);
    expect(parseToPixelInt(undefined as any, DEFAULT)).toBe(DEFAULT);
    expect(parseToPixelInt({} as any, DEFAULT)).toBe(DEFAULT);
  });
});
