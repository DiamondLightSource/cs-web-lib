import { describe, it, expect, vi, beforeEach } from "vitest";

import log from "loglevel";
import { opiParseString } from "../opiParser";
import { bobParseNumber } from "./baseBobParsers";

import {
  bobParseStringNumberMap,
  bobParseResponsiveBreakpoints,
  bobParseResponsiveMargins,
  bobParseResponsiveColumns,
  bobParseResponsiveLayout
} from "./responsiveLayoutBobParser";

vi.mock("../opiParser", () => ({
  opiParseString: vi.fn()
}));

vi.mock("./baseBobParsers", () => ({
  bobParseNumber: vi.fn()
}));

vi.mock("loglevel", () => ({
  default: {
    error: vi.fn()
  }
}));

const asElementCompact = (obj: any) => obj;

describe("bobParseStringNumberMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps string keys to parsed numeric values", () => {
    (bobParseNumber as any).mockReturnValueOnce(1200).mockReturnValueOnce(600);

    const input = asElementCompact({
      lg: "1200",
      md: "600"
    });

    const result = bobParseStringNumberMap(input);

    expect(result).toEqual({
      lg: 1200,
      md: 600
    });

    expect(bobParseNumber).toHaveBeenCalledTimes(2);
  });

  it("filters out null values", () => {
    (bobParseNumber as any).mockReturnValueOnce(1200).mockReturnValueOnce(null);

    const input = asElementCompact({
      lg: "1200",
      md: "invalid"
    });

    const result = bobParseStringNumberMap(input);

    expect(result).toEqual({
      lg: 1200
    });
  });
});

describe("bobParseResponsiveBreakpoints", () => {
  it("delegates to bobParseStringNumberMap", () => {
    (bobParseNumber as any).mockReturnValue(1000);

    const result = bobParseResponsiveBreakpoints(
      asElementCompact({ lg: "1000" })
    );

    expect(result).toEqual({ lg: 1000 });
  });
});

describe("bobParseResponsiveColumns", () => {
  it("delegates to bobParseStringNumberMap", () => {
    (bobParseNumber as any).mockReturnValue(12);

    const result = bobParseResponsiveColumns(asElementCompact({ lg: "12" }));

    expect(result).toEqual({ lg: 12 });
  });
});

describe("bobParseResponsiveMargins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses two space-separated numbers", () => {
    (opiParseString as any).mockReturnValue("10 20");

    const result = bobParseResponsiveMargins(asElementCompact({}));

    expect(result).toEqual([10, 20]);
  });

  it("defaults missing second value", () => {
    (opiParseString as any).mockReturnValue("8");

    const result = bobParseResponsiveMargins(asElementCompact({}));

    expect(result).toEqual([8, 6]);
  });

  it("falls back to default margins on invalid numbers", () => {
    (opiParseString as any).mockReturnValue("10 nope");

    const result = bobParseResponsiveMargins(asElementCompact({}));

    expect(result).toEqual([6, 6]);
    expect(log.error).toHaveBeenCalled();
  });
});

describe("bobParseResponsiveLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses responsive layouts correctly", () => {
    const input = asElementCompact({
      lg: {
        element_position: [
          {
            _attributes: {
              i: "a",
              x: "0",
              y: "1",
              w: "4",
              h: "2"
            }
          }
        ]
      }
    });

    const result = bobParseResponsiveLayout(input);

    expect(result).toEqual({
      lg: [
        {
          i: "a",
          x: 0,
          y: 1,
          w: 4,
          h: 2
        }
      ]
    });
  });

  it("returns empty arrays when no positions exist", () => {
    const input = asElementCompact({
      lg: {
        element_position: []
      }
    });

    const result = bobParseResponsiveLayout(input);

    expect(result).toEqual({
      lg: []
    });
  });

  it("returns empty object if parsing throws", () => {
    const badInput = null as any;

    const result = bobParseResponsiveLayout(badInput);

    expect(result).toEqual({});
    expect(log.error).toHaveBeenCalled();
  });
});
