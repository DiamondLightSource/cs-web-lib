import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { TankComponent } from "./tank";
import { Font } from "../../../types/font";
import { Color } from "../../../types";
import { PvDatum } from "../../../redux/csState";
import { newDType } from "../../../types/dtypes/dType";

// Mock the MUI X-Charts components
vi.mock("@mui/x-charts/BarChart", () => ({
  BarChart: vi.fn(({ series, xAxis, yAxis, sx }) => (
    <div
      data-testid="bar-chart"
      data-series={JSON.stringify(series)}
      data-xaxis={JSON.stringify(xAxis)}
      data-yaxis={JSON.stringify(yAxis)}
      style={sx}
    />
  ))
}));

vi.mock("@mui/x-charts", () => ({
  XAxis: vi.fn(),
  YAxis: vi.fn()
}));

vi.mock("@mui/material", () => ({
  Box: vi.fn(({ children }) => <div data-testid="mui-box">{children}</div>)
}));

// Mock for font.css() function
const mockFontCss = vi.fn().mockReturnValue({
  fontFamily: "Arial",
  fontSize: "12px"
});

describe("TankComponent", () => {
  // Basic test setup
  const defaultProps = {
    pvData: [
      {
        value: newDType({ doubleValue: 50 }, undefined, undefined, {
          units: "mm",
          controlRange: { min: 0, max: 100 }
        })
      } as Partial<PvDatum> as PvDatum
    ],
    connected: true,
    readonly: true,
    pvName: "TEST:PV",
    minimum: 0,
    maximum: 100,
    font: { css: mockFontCss } as Partial<Font> as Font
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders with default props", () => {
      render(<TankComponent {...defaultProps} />);

      const barChart = screen.getByTestId("bar-chart");
      expect(barChart).toBeDefined();

      // Check default orientation (vertical)
      const chartData = JSON.parse(barChart.getAttribute("data-yaxis") ?? "");
      expect(chartData[0].position).toBe("left"); // Default is vertical with scale on left
    });

    test("renders with horizontal orientation", () => {
      render(<TankComponent {...defaultProps} horizontal={true} />);

      const barChart = screen.getByTestId("bar-chart");
      const xAxisData = JSON.parse(barChart.getAttribute("data-xaxis") ?? "");

      expect(xAxisData[0].position).toBe("top"); // Horizontal with scale on top
    });

    test("renders with label when showLabel is true", () => {
      render(<TankComponent {...defaultProps} showLabel={true} />);

      expect(screen.getByText("50")).toBeDefined();
    });

    test("renders with custom precision", () => {
      render(
        <TankComponent {...defaultProps} showLabel={true} precision={2} />
      );

      expect(screen.getByText("50.00")).toBeDefined();
    });

    test("renders with warning when min > max", () => {
      render(
        <TankComponent
          {...defaultProps}
          showLabel={true}
          minimum={200}
          maximum={100}
        />
      );

      expect(screen.getByText("Check min and max values")).toBeDefined();
    });
  });

  describe("PV limits", () => {
    test("uses PV limits when limitsFromPv is true", () => {
      const props = {
        ...defaultProps,
        limitsFromPv: true,
        minimum: 10, // These should be overridden
        maximum: 90 // by the PV control range
      };

      render(<TankComponent {...props} />);

      const barChart = screen.getByTestId("bar-chart");
      const yAxisData = JSON.parse(barChart.getAttribute("data-yaxis") ?? "");

      // Should use PV limits (0, 100) instead of props (10, 90)
      expect(yAxisData[0].min).toBe(0);
      expect(yAxisData[0].max).toBe(100);
    });

    test("handles undefined PV value gracefully", () => {
      const props = {
        ...defaultProps,
        pvData: [
          {
            value: undefined
          } as Partial<PvDatum> as PvDatum
        ]
      };

      render(<TankComponent {...props} />);

      const barChart = screen.getByTestId("bar-chart");
      const seriesData = JSON.parse(barChart.getAttribute("data-series") ?? "");

      expect(seriesData[0].data[0]).toBe(0);
    });

    test("handles edge case with value equal to maximum", () => {
      const props = {
        ...defaultProps,
        pvData: [
          {
            value: newDType({ doubleValue: 100 }, undefined, undefined, {
              units: "mm",
              controlRange: { min: 0, max: 100 }
            })
          } as Partial<PvDatum> as PvDatum
        ]
      };

      render(<TankComponent {...props} />);

      const barChart = screen.getByTestId("bar-chart");
      const seriesData = JSON.parse(barChart.getAttribute("data-series") ?? "");

      expect(seriesData[0].data[0]).toBe(100);
      expect(seriesData[1].data[0]).toBe(0); // Empty part should be 0
    });

    test("handles edge case with value below minimum", () => {
      const props = {
        ...defaultProps,
        pvData: [
          {
            value: newDType({ doubleValue: -10 }, undefined, undefined, {
              units: "mm",
              controlRange: { min: 0, max: 100 }
            })
          } as Partial<PvDatum> as PvDatum
        ]
      };

      render(<TankComponent {...props} />);

      const barChart = screen.getByTestId("bar-chart");
      const seriesData = JSON.parse(barChart.getAttribute("data-series") ?? "");

      expect(seriesData[0].data[0]).toBe(-10);
    });
  });

  describe("Styling", () => {
    test("applies custom colors", () => {
      const fillColor = Color.fromRgba(100, 150, 200);
      const emptyColor = Color.fromRgba(200, 200, 200);
      const backgroundColor = Color.fromRgba(240, 240, 240);

      render(
        <TankComponent
          {...defaultProps}
          fillColor={fillColor}
          emptyColor={emptyColor}
          backgroundColor={backgroundColor}
        />
      );

      const barChart = screen.getByTestId("bar-chart");
      const seriesData = JSON.parse(barChart.getAttribute("data-series") ?? "");

      expect(seriesData[0].color).toBe(fillColor.toString());
      expect(seriesData[1].color).toBe(emptyColor.toString());

      // Check background color is applied
      expect(barChart.style.backgroundColor).toBe("rgb(240, 240, 240)");
    });

    test("applies transparent background when transparent is true", () => {
      render(<TankComponent {...defaultProps} transparent={true} />);

      const barChart = screen.getByTestId("bar-chart");
      expect(barChart.style.backgroundColor).toBe("transparent");
    });

    test("hides scale when scaleVisible is false", () => {
      render(<TankComponent {...defaultProps} scaleVisible={false} />);

      const barChart = screen.getByTestId("bar-chart");
      const yAxisData = JSON.parse(barChart.getAttribute("data-yaxis") ?? "");

      expect(yAxisData[0].position).toBe("none");
    });

    test("applies log scale when logScale is true", () => {
      render(<TankComponent {...defaultProps} logScale={true} />);

      const barChart = screen.getByTestId("bar-chart");
      const yAxisData = JSON.parse(barChart.getAttribute("data-yaxis") ?? "");

      expect(yAxisData[0].scaleType).toBe("symlog");
    });

    test("applies font styling to label", () => {
      render(<TankComponent {...defaultProps} showLabel={true} />);

      const labelContainer = screen.getByText("50");
      expect(labelContainer?.style.fontFamily).toBe("Arial");
      expect(labelContainer?.style.fontSize).toBe("12px");
    });
  });
});
