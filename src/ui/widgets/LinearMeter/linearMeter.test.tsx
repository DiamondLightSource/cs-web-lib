import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import PropTypes from "prop-types";
import { LinearMeterComponent } from "./linearMeter";
import * as utils from "../utils";
import * as meterUtilities from "../Meter/meterUtilities";
import * as linearMeterUtilities from "./linearMeterUtilities";
import { PvDatum } from "../../../redux/csState";
import { TriangleProps } from "./trianglePointer";
import { RectangleAreaProps } from "./rectangleArea";
import { ChartsReferenceLineProps } from "@mui/x-charts";
import { newDType } from "../../../types/dtypes";
import { ColorUtils } from "../../../types/color";

vi.mock("@mui/x-charts/BarChart", () => {
  const MockBarChart: React.FC<any> = ({ children, ...props }) => (
    <div data-testid="bar-chart" {...props}>
      {children}
    </div>
  );
  MockBarChart.propTypes = { children: PropTypes.node };

  return {
    BarChart: MockBarChart,
    BarSeries: vi.fn()
  };
});

vi.mock("@mui/x-charts", () => {
  const MockChartsReferenceLine = ({
    x,
    y,
    ...props
  }: ChartsReferenceLineProps) => (
    <div data-testid="reference-line" data-x={x} data-y={y} {...props}></div>
  );
  MockChartsReferenceLine.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number
  };

  return {
    ChartsReferenceLine: MockChartsReferenceLine,
    chartsTooltipClasses: {
      root: "root-class",
      labelCell: "label-cell-class"
    },
    XAxis: vi.fn(),
    YAxis: vi.fn()
  };
});

vi.mock("./rectangleArea", () => {
  const MockRectangleAreaHorizontal = ({
    minimum,
    maximum,
    fill
  }: RectangleAreaProps) => (
    <div
      data-testid="rectangle-area-horizontal"
      data-min={minimum}
      data-max={maximum}
      data-fill={fill}
    ></div>
  );
  MockRectangleAreaHorizontal.propTypes = {
    minimum: PropTypes.number,
    maximum: PropTypes.number,
    fill: PropTypes.string
  };

  const MockRectangleAreaVertical = ({
    minimum,
    maximum,
    fill
  }: RectangleAreaProps) => (
    <div
      data-testid="rectangle-area-vertical"
      data-min={minimum}
      data-max={maximum}
      data-fill={fill}
    ></div>
  );
  MockRectangleAreaVertical.propTypes = {
    minimum: PropTypes.number,
    maximum: PropTypes.number,
    fill: PropTypes.string
  };

  return {
    RectangleAreaHorizontal: MockRectangleAreaHorizontal,
    RectangleAreaVertical: MockRectangleAreaVertical
  };
});

vi.mock("./trianglePointer", () => {
  const MockTrianglePointerHorizontal = ({
    value,
    size,
    fill
  }: TriangleProps) => (
    <div
      data-testid="triangle-pointer-horizontal"
      data-value={value}
      data-size={size}
      data-fill={fill}
    ></div>
  );
  MockTrianglePointerHorizontal.propTypes = {
    value: PropTypes.number,
    size: PropTypes.number,
    fill: PropTypes.string
  };

  const MockTrianglePointerVertical = ({
    value,
    size,
    fill
  }: TriangleProps) => (
    <div
      data-testid="triangle-pointer-vertical"
      data-value={value}
      data-size={size}
      data-fill={fill}
    ></div>
  );
  MockTrianglePointerVertical.propTypes = {
    value: PropTypes.number,
    size: PropTypes.number,
    fill: PropTypes.string
  };

  return {
    TrianglePointerHorizontal: MockTrianglePointerHorizontal,
    TrianglePointerVertical: MockTrianglePointerVertical
  };
});

describe("LinearMeterComponent", () => {
  const mockTheme = createTheme();
  const defaultProps = {
    pvData: [
      {
        effectivePvName: "TEST:PV",
        connected: true,
        readonly: true,
        value: newDType({ doubleValue: 50 }, undefined, undefined, {
          units: "kW",
          controlRange: { min: 0, max: 100 },
          alarmRange: { min: 80, max: 100 },
          warningRange: { min: 60, max: 80 }
        })
      } as Partial<PvDatum> as PvDatum
    ],
    minimum: 0,
    maximum: 100,
    format: 1,
    limitsFromPv: true,
    displayHorizontal: true,
    scaleVisible: true,
    showUnits: true,
    showLimits: true,
    levelHihi: 90,
    levelHigh: 80,
    levelLow: 20,
    levelLolo: 10,
    needleWidth: 1,
    knobSize: 8,
    colors: {
      foregroundColor: ColorUtils.BLACK,
      backgroundColor: ColorUtils.WHITE,
      needleColor: ColorUtils.RED,
      knobColor: ColorUtils.BLUE
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(utils, "getPvValueAndName").mockReturnValue({
      value: newDType({ doubleValue: 50 }, undefined, undefined, {
        units: "mm",
        alarmRange: { min: 10, max: 90 },
        warningRange: { min: 20, max: 80 },
        controlRange: { min: 0, max: 100 }
      }),
      effectivePvName: "test:pv",
      connected: true
    });

    vi.spyOn(meterUtilities, "convertInfAndNanToUndefined").mockImplementation(
      val => val
    );
    vi.spyOn(meterUtilities, "formatValue").mockReturnValue(() => "50");

    vi.spyOn(linearMeterUtilities, "buildStatusRegions").mockReturnValue([
      { minimum: 0, maximum: 10, fill: "red" },
      { minimum: 10, maximum: 20, fill: "yellow" },
      { minimum: 20, maximum: 80, fill: "green" },
      { minimum: 80, maximum: 90, fill: "yellow" },
      { minimum: 90, maximum: 100, fill: "red" }
    ]);
  });

  it("renders horizontal meter", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent {...defaultProps} />
      </ThemeProvider>
    );

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("rectangle-area-horizontal")).toHaveLength(5);
    expect(
      screen.getByTestId("triangle-pointer-horizontal")
    ).toBeInTheDocument();
    expect(screen.getByTestId("triangle-pointer-horizontal")).toHaveAttribute(
      "data-value",
      "50"
    );
  });

  it("renders vertical meter", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent {...defaultProps} displayHorizontal={false} />
      </ThemeProvider>
    );

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("rectangle-area-vertical")).toHaveLength(5);
    expect(screen.getByTestId("triangle-pointer-vertical")).toBeInTheDocument();
    expect(screen.getByTestId("triangle-pointer-vertical")).toHaveAttribute(
      "data-value",
      "50"
    );
  });

  it("respects limitsFromPv when true", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent {...defaultProps} limitsFromPv={true} />
      </ThemeProvider>
    );

    expect(utils.getPvValueAndName).toHaveBeenCalled();
    expect(meterUtilities.convertInfAndNanToUndefined).toHaveBeenCalledTimes(4);
  });

  it("uses provided limits when limitsFromPv is false", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent
          {...defaultProps}
          limitsFromPv={false}
          levelHihi={95}
          levelHigh={85}
          levelLow={15}
          levelLolo={5}
        />
      </ThemeProvider>
    );

    expect(linearMeterUtilities.buildStatusRegions).toHaveBeenCalledWith(
      5,
      15,
      85,
      95,
      0,
      100,
      expect.anything(),
      true,
      50
    );
  });

  it("hides scale when scaleVisible is false", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent {...defaultProps} scaleVisible={false} />
      </ThemeProvider>
    );

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("hides limits when showLimits is false", () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent {...defaultProps} showLimits={false} />
      </ThemeProvider>
    );

    expect(linearMeterUtilities.buildStatusRegions).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      false,
      expect.anything()
    );
  });

  it("applies custom colors correctly", () => {
    const customColors = {
      foregroundColor: ColorUtils.BLACK,
      backgroundColor: ColorUtils.WHITE,
      needleColor: ColorUtils.RED,
      knobColor: ColorUtils.YELLOW
    };

    render(
      <ThemeProvider theme={mockTheme}>
        <LinearMeterComponent {...defaultProps} colors={customColors} />
      </ThemeProvider>
    );

    expect(screen.getByTestId("triangle-pointer-horizontal")).toHaveAttribute(
      "data-fill",
      ColorUtils.YELLOW.colorString
    );
  });
});
