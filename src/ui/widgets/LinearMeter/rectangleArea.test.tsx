import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import {
  RectangleAreaHorizontal,
  RectangleAreaVertical
} from "./rectangleArea";
import * as MuiCharts from "@mui/x-charts";

vi.mock("@mui/x-charts", () => ({
  useDrawingArea: vi.fn(),
  useXScale: vi.fn(),
  useYScale: vi.fn()
}));

describe("RectangleAreaHorizontal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with default props", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal minimum={5} maximum={10} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute("x", "50");
    expect(rect).toHaveAttribute("y", "10");
    expect(rect).toHaveAttribute("width", "50");
    expect(rect).toHaveAttribute("height", "200");
    expect(rect).toHaveAttribute("fill", "rgba(0, 0, 0, 1)");
    expect(rect).toHaveAttribute("stroke", "rgba(0, 0, 0, 1)");
    expect(rect).toHaveAttribute("stroke-width", "1");
  });

  it("renders with custom fill and stroke", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal
        minimum={5}
        maximum={10}
        fill="rgba(255, 0, 0, 0.5)"
        stroke="blue"
      />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("fill", "rgba(255, 0, 0, 0.5)");
    expect(rect).toHaveAttribute("stroke", "blue");
  });

  it("handles reversed values correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal minimum={10} maximum={5} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("x", "50");
    expect(rect).toHaveAttribute("width", "50");
  });

  it("handles minimum out of range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 2) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal minimum={2} maximum={50} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("x", "20");
    expect(rect).toHaveAttribute("width", "80");
  });

  it("handles maximum out of range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 20) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal minimum={2} maximum={50} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("x", "40");
    expect(rect).toHaveAttribute("width", "280");
  });

  it("handles maximum and minimum greater than range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 20) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal minimum={40} maximum={50} />
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });

  it("handles maximum and minimum less than range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue(
      ((value: number) => value * 0.5) as any
    );

    const { container } = render(
      <RectangleAreaHorizontal minimum={4} maximum={5} />
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });

  it("returns null when scale returns null values", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useXScale).mockReturnValue((() => null) as any);

    const { container } = render(
      <RectangleAreaHorizontal minimum={5} maximum={10} />
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });
});

describe("RectangleAreaVertical", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders correctly with default props", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaVertical minimum={5} maximum={10} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute("x", "20");
    expect(rect).toHaveAttribute("y", "50");
    expect(rect).toHaveAttribute("width", "300");
    expect(rect).toHaveAttribute("height", "50");
    expect(rect).toHaveAttribute("fill", "rgba(0, 0, 0, 1)");
  });

  it("renders with custom fill and stroke", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaVertical
        minimum={5}
        maximum={10}
        fill="rgba(0, 255, 0, 0.5)"
        stroke="red"
      />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("fill", "rgba(0, 255, 0, 0.5)");
    expect(rect).toHaveAttribute("stroke", "red");
  });

  it("handles reversed values correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaVertical minimum={10} maximum={5} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("y", "50");
    expect(rect).toHaveAttribute("height", "50");
  });

  it("handles minimum out of range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 2) as any
    );

    const { container } = render(
      <RectangleAreaVertical minimum={2} maximum={30} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("y", "10");
    expect(rect).toHaveAttribute("height", "50");
  });

  it("handles maximum out of range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaVertical minimum={4} maximum={30} />
    );

    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("y", "40");
    expect(rect).toHaveAttribute("height", "170");
  });

  it("handles maximum and minimum greater than range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 10) as any
    );

    const { container } = render(
      <RectangleAreaVertical minimum={25} maximum={30} />
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });

  it("handles maximum and minimum less than range correctly", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue(
      ((value: number) => value * 0.5) as any
    );

    const { container } = render(
      <RectangleAreaVertical minimum={5} maximum={10} />
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });

  it("returns null when scale returns null values", () => {
    vi.mocked(MuiCharts.useDrawingArea).mockReturnValue({
      top: 10,
      height: 200,
      left: 20,
      width: 300
    } as any);
    vi.mocked(MuiCharts.useYScale).mockReturnValue((() => null) as any);

    const { container } = render(
      <RectangleAreaVertical minimum={5} maximum={10} />
    );

    expect(container.querySelector("rect")).not.toBeInTheDocument();
  });
});
