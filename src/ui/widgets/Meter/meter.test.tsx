import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MeterComponent } from "./meter";
import { Color } from "../../../types/color";
import { NumberFormatEnum } from "./meterUtilities";
import * as meterUtilities from "./meterUtilities";
import { DType, Font } from "../../../types";

vi.mock("react-gauge-component", () => ({
  GaugeComponent: vi.fn(
    ({ value, minValue, maxValue, pointer, arc, labels }) => (
      <div
        data-testid="gauge-component"
        data-value={value}
        data-min={minValue}
        data-max={maxValue}
      >
        <div data-testid="pointer" data-color={pointer.color}></div>
        <div data-testid="arc" data-subarcs={JSON.stringify(arc.subArcs)}></div>
        <div
          data-testid="value-label"
          data-hide={labels.valueLabel.hide}
          data-fontFamily={labels.valueLabel.style.fontFamily}
        ></div>
      </div>
    )
  )
}));

vi.mock("./meterUtilities", async () => {
  const actual = await vi.importActual("./meterUtilities");
  return {
    ...actual,
    formatValue: vi.fn(
      (value, format, precision, units, showUnits) => () => `${value}`
    ),
    buildSubArcs: vi.fn(() => [{ color: "red", start: 0, end: 100 }]),
    createIntervals: vi.fn(() => [0, 25, 50, 75, 100]),
    convertInfAndNanToUndefined: vi.fn(val => val)
  };
});

describe("MeterComponent", () => {
  const defaultProps = {
    connected: false,
    readonly: true,
    pvName: "PV:Test",
    value: {
      getDoubleValue: () => 50,
      display: {
        units: "kW",
        controlRange: { min: 0, max: 100 },
        alarmRange: { min: 80, max: 100 },
        warningRange: { min: 60, max: 80 }
      }
    } as Partial<DType> as DType,
    foregroundColor: Color.fromRgba(0, 0, 0, 1),
    needleColor: Color.fromRgba(255, 5, 7, 1),
    backgroundColor: Color.fromRgba(250, 250, 250, 1)
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<MeterComponent {...defaultProps} />);

    const gaugeComponent = screen.getByTestId("gauge-component");
    expect(gaugeComponent).toBeInTheDocument();
    expect(gaugeComponent.getAttribute("data-value")).toBe("50");
    expect(gaugeComponent.getAttribute("data-min")).toBe("0");
    expect(gaugeComponent.getAttribute("data-max")).toBe("100");
  });

  it("uses custom min/max values when limitsFromPv is false", () => {
    render(
      <MeterComponent
        {...defaultProps}
        minimum={-50}
        maximum={150}
        limitsFromPv={false}
      />
    );

    const gaugeComponent = screen.getByTestId("gauge-component");
    expect(gaugeComponent.getAttribute("data-min")).toBe("-50");
    expect(gaugeComponent.getAttribute("data-max")).toBe("150");
  });

  it("uses PV limits when limitsFromPv is true", () => {
    render(
      <MeterComponent
        {...defaultProps}
        minimum={-50}
        maximum={150}
        limitsFromPv={true}
      />
    );

    const gaugeComponent = screen.getByTestId("gauge-component");
    expect(gaugeComponent.getAttribute("data-min")).toBe("0"); // From controlRange.min
    expect(gaugeComponent.getAttribute("data-max")).toBe("100"); // From controlRange.max
  });

  it("uses transparent background when transparent is true", () => {
    render(<MeterComponent {...defaultProps} transparent={true} />);

    const box = screen.getByTestId("gauge-component").parentElement;
    expect(box).toHaveStyle("background-color: rgba(0, 0, 0, 0)");
  });

  it("hides value when showValue is false", () => {
    render(<MeterComponent {...defaultProps} showValue={false} />);

    const valueLabel = screen.getByTestId("value-label");
    expect(valueLabel.getAttribute("data-hide")).toBe("true");
  });

  it("calls formatValue with correct parameters", () => {
    render(
      <MeterComponent
        {...defaultProps}
        format={NumberFormatEnum.Exponential}
        precision={2}
        showUnits={true}
      />
    );

    expect(meterUtilities.formatValue).toHaveBeenCalledWith(
      50,
      NumberFormatEnum.Exponential,
      2,
      "kW",
      true
    );
  });

  it("calls buildSubArcs with correct parameters", () => {
    render(<MeterComponent {...defaultProps} />);

    expect(meterUtilities.buildSubArcs).toHaveBeenCalledWith(
      "rgba(0,0,0,1)",
      0,
      100,
      80,
      60,
      80,
      100
    );
  });

  it("handles missing PV value gracefully", () => {
    render(<MeterComponent {...defaultProps} value={undefined} />);

    const gaugeComponent = screen.getByTestId("gauge-component");
    expect(gaugeComponent.getAttribute("data-value")).toBe("0");
  });

  it("scales width correctly based on height/width ratio", () => {
    render(<MeterComponent {...defaultProps} height={100} width={300} />);

    const box = screen.getByTestId("gauge-component").parentElement;
    expect(box).toHaveStyle("width: 190px"); // 1.9 * height
  });

  it("uses default width when width/height ratio is less than 1.9", () => {
    render(<MeterComponent {...defaultProps} height={100} width={150} />);

    const box = screen.getByTestId("gauge-component").parentElement;
    expect(box).toHaveStyle("width: 150px"); // original width
  });

  it("applies font styles correctly", () => {
    const font = {
      css: () => ({ fontFamily: "Arial" })
    } as Partial<Font> as Font;

    render(<MeterComponent {...defaultProps} font={font} />);

    const valueLabel = screen.getByTestId("value-label");

    const labelStyle = valueLabel.getAttribute("data-fontFamily");
    expect(labelStyle).toBe("Arial");
  });
});
