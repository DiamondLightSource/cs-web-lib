import { describe, it, expect } from "vitest";
import { parseToPixelInt } from "./utils";

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
