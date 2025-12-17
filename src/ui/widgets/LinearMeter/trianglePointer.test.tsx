import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import {
  TrianglePointerHorizontal,
  TrianglePointerVertical
} from "./trianglePointer";

import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts";

vi.mock("@mui/x-charts", () => ({
  useDrawingArea: vi.fn(),
  useXScale: vi.fn(),
  useYScale: vi.fn()
}));

describe("TrianglePointerHorizontal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders a triangle with default props", () => {
    vi.mocked(useXScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(<TrianglePointerHorizontal value={5} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute("fill")).toBe("#000000ff");
    expect(polygon?.getAttribute("points")).toBe("50,19 55,9 45,9");
  });

  it("renders a triangle with expected size and fill", () => {
    vi.mocked(useXScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(
      <TrianglePointerHorizontal value={5} size={20} fill="#ff0000" />
    );

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute("fill")).toBe("#ff0000");
    expect(polygon?.getAttribute("points")).toBe("50,19 60,-1 40,-1");
  });

  it("returns null if x is less the the lower limit", () => {
    vi.mocked(useXScale).mockReturnValue(((value: number) => 10) as any);
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(
      <TrianglePointerHorizontal value={5} size={20} fill="#ff0000" />
    );

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeNull();
  });

  it("returns null if x is greater than the the upper limit", () => {
    vi.mocked(useXScale).mockReturnValue(((value: number) => 210) as any);
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(
      <TrianglePointerHorizontal value={5} size={20} fill="#ff0000" />
    );

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeNull();
  });

  it("returns null when xCoord is undefined", () => {
    vi.mocked(useXScale).mockReturnValue((() => undefined) as any);
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(<TrianglePointerHorizontal value={5} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeNull();
  });
});

describe("TrianglePointerVertical", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders a triangle with default props", () => {
    vi.mocked(useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(<TrianglePointerVertical value={5} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute("fill")).toBe("#000000ff");
    expect(polygon?.getAttribute("points")).toBe("29,50 19,45 19,55");
  });

  it("renders a triangle with expected size and fill", () => {
    vi.mocked(useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(
      <TrianglePointerVertical value={5} size={20} fill="#ff0000" />
    );

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute("fill")).toBe("#ff0000");
    expect(polygon?.getAttribute("points")).toBe("29,50 9,40 9,60");
  });

  it("returns null when yCoord is less than the lower limit", () => {
    vi.mocked(useYScale).mockReturnValue((() => 5) as any);
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(<TrianglePointerVertical value={5} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeNull();
  });

  it("returns null when yCoord is greater than the upper limit", () => {
    vi.mocked(useYScale).mockReturnValue((() => 105) as any);
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(<TrianglePointerVertical value={5} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeNull();
  });

  it("returns null when yCoord is undefined", () => {
    vi.mocked(useYScale).mockReturnValue((() => undefined) as any);
    vi.mocked(useDrawingArea).mockReturnValue({
      top: 20,
      left: 30,
      bottom: 100,
      right: 200,
      width: 170,
      height: 80
    });

    const { container } = render(<TrianglePointerVertical value={5} />);

    const polygon = container.querySelector("polygon");
    expect(polygon).toBeNull();
  });
});
