import { describe, it, expect, vi } from "vitest";
import {
  calculateDefaultLayout,
  calculateDefaultLayoutWithHorizontalCompactor,
  toNumber,
  sameKeys
} from "./displayLayoutUtilities";
import { horizontalCompactor, verticalCompactor } from "react-grid-layout";

vi.mock("react-grid-layout", () => ({
  horizontalCompactor: {
    compact: vi.fn(layout => layout)
  },
  verticalCompactor: {
    compact: vi.fn(layout => layout)
  }
}));

const createChild = (id: string, position = {}) =>
  ({
    props: { id, position }
  }) as any;

describe("toNumber", () => {
  it("returns valid numbers as-is", () => {
    expect(toNumber(10)).toBe(10);
  });

  it("returns fallback for invalid numbers", () => {
    expect(toNumber(NaN, 5)).toBe(5);
    expect(toNumber(Infinity, 5)).toBe(5);
  });

  it("parses numeric strings", () => {
    expect(toNumber("42")).toBe(42);
    expect(toNumber("42.5")).toBe(42.5);
  });

  it("returns fallback for percentage strings", () => {
    expect(toNumber("50%", 3)).toBe(3);
  });

  it("returns fallback for invalid strings", () => {
    expect(toNumber("abc", 7)).toBe(7);
  });

  it("returns fallback for null/undefined", () => {
    expect(toNumber(undefined, 2)).toBe(2);
    expect(toNumber(null, 2)).toBe(2);
  });
});

describe("sameKeys", () => {
  it("returns true for identical keys (order independent)", () => {
    expect(sameKeys({ a: 1, b: 2 }, { b: 3, a: 4 })).toBe(true);
  });

  it("returns false when keys differ", () => {
    expect(sameKeys({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false for completely different keys", () => {
    expect(sameKeys({ a: 1 }, { b: 2 })).toBe(false);
  });

  it("returns true for empty objects", () => {
    expect(sameKeys({}, {})).toBe(true);
  });
});

describe("calculateDefaultLayout", () => {
  const margins: [number, number] = [6, 6];
  const cellHeight = 15;

  it("creates layout entries for each child", () => {
    const children = [createChild("a"), createChild("b")];

    const layout = calculateDefaultLayout(
      children,
      1200,
      12,
      margins,
      cellHeight
    );

    expect(layout).toHaveLength(2);
    expect(layout[0]).toMatchObject({ i: "a" });
    expect(layout[1]).toMatchObject({ i: "b" });
  });

  it("uses default values when no position is provided", () => {
    const children = [createChild("a")];

    const layout = calculateDefaultLayout(
      children,
      1200,
      12,
      margins,
      cellHeight
    );

    expect(layout[0]).toMatchObject({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
  });

  it("calculates width and height based on position", () => {
    const children = [createChild("a", { width: 200, height: 60 })];

    const layout = calculateDefaultLayout(
      children,
      1200,
      12,
      margins,
      cellHeight
    );

    expect(layout[0].w).toBe(3);
    expect(layout[0].h).toBe(3);
  });

  it("calculates x and y positions", () => {
    const children = [createChild("a", { x: 100, y: 50 })];

    const layout = calculateDefaultLayout(
      children,
      1200,
      12,
      margins,
      cellHeight
    );

    expect(layout[0].x).toBe(1);
    expect(layout[0].y).toBe(2);
  });

  it("never produces negative coordinates", () => {
    const children = [createChild("a", { x: -100, y: -50 })];

    const layout = calculateDefaultLayout(
      children,
      1200,
      12,
      margins,
      cellHeight
    );

    expect(layout[0].x).toBe(0);
    expect(layout[0].y).toBe(0);
  });

  it("calls verticalCompactor", () => {
    const children = [createChild("a")];

    calculateDefaultLayout(children, 1200, 12, margins, cellHeight);

    expect(verticalCompactor.compact).toHaveBeenCalled();
  });
});

describe("calculateDefaultLayoutWithHorizontalCompactor", () => {
  it("calls horizontalCompactor after generating layout", () => {
    const children = [createChild("a")];

    const layout = calculateDefaultLayoutWithHorizontalCompactor(
      children,
      1200,
      12,
      [6, 6],
      15
    );

    expect(horizontalCompactor.compact).toHaveBeenCalledWith(
      expect.any(Array),
      12
    );

    expect(layout).toEqual(expect.any(Array));
  });
});
