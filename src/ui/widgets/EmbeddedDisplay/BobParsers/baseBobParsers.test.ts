import { describe, it, expect } from "vitest";
import { bobParseNumber, bobParseNumberMandatory } from "./baseBobParsers";

const element = (_text: any) => ({ _text });

describe("bobParseNumber", () => {
  it("parses a valid integer string", () => {
    const result = bobParseNumber(element("42"));
    expect(result).toBe(42);
  });

  it("parses a valid float string", () => {
    const result = bobParseNumber(element("3.14"));
    expect(result).toBe(3.14);
  });

  it("returns NaN for non-numeric strings", () => {
    const result = bobParseNumber(element("not-a-number"));
    expect(result).toBeNaN();
  });

  it("returns NaN when _text is undefined", () => {
    const result = bobParseNumber({} as any);
    expect(result).toBeNaN();
  });

  it("returns undefined if accessing _text throws", () => {
    const badElement = {
      get _text() {
        throw new Error("boom");
      }
    };

    const result = bobParseNumber(badElement as any);
    expect(result).toBeUndefined();
  });
});

describe("bobParseNumberMandatory", () => {
  it("parses a valid integer string", () => {
    const result = bobParseNumberMandatory(element("100"));
    expect(result).toBe(100);
  });

  it("parses a valid float string", () => {
    const result = bobParseNumberMandatory(element("2.5"));
    expect(result).toBe(2.5);
  });

  it("returns NaN for non-numeric strings (does NOT throw)", () => {
    const result = bobParseNumberMandatory(element("invalid"));
    expect(result).toBeNaN();
  });

  it("throws if accessing _text throws", () => {
    const badElement = {
      get _text() {
        throw new Error("boom");
      }
    };

    expect(() => bobParseNumberMandatory(badElement as any)).toThrowError(
      "Could not parse number from value undefined."
    );
  });
});
