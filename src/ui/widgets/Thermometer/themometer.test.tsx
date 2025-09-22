// Thermometer.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import * as d3 from "d3";
import {
  calculateMercuryHeight,
  calculateThermometerDimensions,
  ThermometerComponent
} from "./thermometer";
import { Color } from "../../../types/color";
import { DType } from "../../../types";

// Mock d3 functionality
vi.mock("d3", () => {
  const actualD3 = vi.importActual("d3");
  return {
    ...actualD3,
    select: vi.fn().mockReturnValue({
      attr: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnValue({
        attr: vi.fn().mockReturnThis(),
        style: vi.fn().mockReturnThis()
      }),
      selectAll: vi.fn().mockReturnValue({
        remove: vi.fn()
      })
    }),
    path: vi.fn().mockReturnValue({
      moveTo: vi.fn().mockReturnThis(),
      arcTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      arc: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      toString: vi.fn().mockReturnValue("path-string")
    })
  };
});

describe("Thermometer Component", () => {
  const mandatoryProps = {
    connected: false,
    readonly: true,
    pvName: "PV:Test"
  };

  const mockValue = {
    getDoubleValue: vi.fn().mockReturnValue(50),
    display: {
      controlRange: {
        min: 0,
        max: 100
      }
    }
  } as Partial<DType> as DType;

  describe("calculateThermometerDimensions", () => {
    it("should calculate correct dimensions for maximum thermometer width", () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      const expectedStemHalfWidth = 10;
      const bulbUpperHeight = expectedStemHalfWidth / 0.80901699;
      const expectedBulbRadius = expectedStemHalfWidth / 0.587785;
      const expectedTopOfStemY = expectedStemHalfWidth + 2;
      const expectedVerticalStemHeight =
        156 - expectedStemHalfWidth - expectedBulbRadius - bulbUpperHeight;

      const dimensions = calculateThermometerDimensions(44, 160);

      expect(dimensions.outerWidth).toBe(44);
      expect(dimensions.outerHeight).toBe(160);
      expect(dimensions.bulbCenterX).toBe(22);

      expect(dimensions.stemHalfWidth).toBe(expectedStemHalfWidth);
      expect(dimensions.verticalStemHeight).toBeCloseTo(
        expectedVerticalStemHeight,
        3
      );

      expect(dimensions.topOfStemY).toBeCloseTo(expectedTopOfStemY, 3);
      expect(dimensions.bulbCenterY).toBeCloseTo(
        expectedTopOfStemY + expectedVerticalStemHeight + bulbUpperHeight,
        3
      );
      expect(dimensions.bottomOfStemY).toBeCloseTo(
        expectedTopOfStemY +
          156 -
          expectedStemHalfWidth -
          expectedBulbRadius -
          bulbUpperHeight,
        3
      );
      expect(dimensions.leftSideStemX).toBe(22 - expectedStemHalfWidth);
      expect(dimensions.rightSideStemX).toBe(22 + expectedStemHalfWidth);
      expect(dimensions.bulbRadius).toBeCloseTo(expectedBulbRadius, 3);
    });

    it("should calculate correct dimensions for narrow width", () => {
      const expectedStemHalfWidth = 6;
      const bulbUpperHeight = expectedStemHalfWidth / 0.80901699;
      const expectedBulbRadius = expectedStemHalfWidth / 0.587785;
      const expectedTopOfStemY = expectedStemHalfWidth + 2;
      const expectedVerticalStemHeight =
        156 - expectedStemHalfWidth - expectedBulbRadius - bulbUpperHeight;

      const dimensions = calculateThermometerDimensions(26, 160);

      expect(dimensions.outerWidth).toBe(26);
      expect(dimensions.outerHeight).toBe(160);
      expect(dimensions.bulbCenterX).toBe(13);

      expect(dimensions.stemHalfWidth).toBe(expectedStemHalfWidth);
      expect(dimensions.verticalStemHeight).toBeCloseTo(
        expectedVerticalStemHeight,
        3
      );

      expect(dimensions.topOfStemY).toBeCloseTo(expectedTopOfStemY, 3);
      expect(dimensions.bulbCenterY).toBeCloseTo(
        expectedTopOfStemY + expectedVerticalStemHeight + bulbUpperHeight,
        3
      );
      expect(dimensions.bottomOfStemY).toBeCloseTo(
        expectedTopOfStemY +
          156 -
          expectedStemHalfWidth -
          expectedBulbRadius -
          bulbUpperHeight,
        3
      );
      expect(dimensions.leftSideStemX).toBe(13 - expectedStemHalfWidth);
      expect(dimensions.rightSideStemX).toBe(13 + expectedStemHalfWidth);
      expect(dimensions.bulbRadius).toBeCloseTo(expectedBulbRadius, 3);
    });

    it("should calculate correct dimensions for squat thermometer", () => {
      const expectedStemHalfWidth = 10;
      const bulbUpperHeight = expectedStemHalfWidth / 0.80901699;
      const expectedBulbRadius = expectedStemHalfWidth / 0.587785;
      const expectedTopOfStemY = expectedStemHalfWidth + 2;
      const expectedVerticalStemHeight =
        36 - expectedStemHalfWidth - expectedBulbRadius - bulbUpperHeight;

      const dimensions = calculateThermometerDimensions(64, 40);

      expect(dimensions.outerWidth).toBe(64);
      expect(dimensions.outerHeight).toBe(40);
      expect(dimensions.bulbCenterX).toBe(32);

      expect(dimensions.stemHalfWidth).toBe(expectedStemHalfWidth);
      expect(dimensions.verticalStemHeight).toBeCloseTo(
        expectedVerticalStemHeight,
        3
      );

      expect(dimensions.topOfStemY).toBeCloseTo(expectedTopOfStemY, 3);
      expect(dimensions.bulbCenterY).toBeCloseTo(
        expectedTopOfStemY + expectedVerticalStemHeight + bulbUpperHeight,
        3
      );
      expect(dimensions.bottomOfStemY).toBeCloseTo(
        expectedTopOfStemY +
          36 -
          expectedStemHalfWidth -
          expectedBulbRadius -
          bulbUpperHeight,
        3
      );
      expect(dimensions.leftSideStemX).toBe(32 - expectedStemHalfWidth);
      expect(dimensions.rightSideStemX).toBe(32 + expectedStemHalfWidth);
      expect(dimensions.bulbRadius).toBeCloseTo(expectedBulbRadius, 3);
    });
  });

  describe("calculateMercuryHeight", () => {
    // Test constants
    const minimum = 0;
    const maximum = 100;
    const verticalStemHeight = 200;
    const topOfStemY = 50;

    // Mock DType class
    const mockDType = (value: number) => {
      return {
        getDoubleValue: vi.fn().mockReturnValue(value),
        display: {
          controlRange: {
            min: 0,
            max: 100
          }
        }
      } as Partial<DType> as DType;
    };

    it("should calculate correct mercury height for a value in range", () => {
      const value = mockDType(50);

      const result = calculateMercuryHeight(
        value,
        minimum,
        maximum,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(100);
      expect(result.mercurySurfaceLevelY).toBe(150);
    });

    it("should handle value at minimum", () => {
      const value = mockDType(minimum);

      const result = calculateMercuryHeight(
        value,
        minimum,
        maximum,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(0);
      expect(result.mercurySurfaceLevelY).toBe(250);
    });

    it("should handle value at maximum", () => {
      const value = mockDType(maximum);

      const result = calculateMercuryHeight(
        value,
        minimum,
        maximum,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(200);
      expect(result.mercurySurfaceLevelY).toBe(50);
    });

    it("should fix mercury level to the minimum when value is below minimum", () => {
      const value = mockDType(-20);

      const result = calculateMercuryHeight(
        value,
        minimum,
        maximum,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(0);
      expect(result.mercurySurfaceLevelY).toBe(250);
    });

    it("should fix mercury level to the maximum when value above maximum", () => {
      const value = mockDType(120);

      const result = calculateMercuryHeight(
        value,
        minimum,
        maximum,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(200);
      expect(result.mercurySurfaceLevelY).toBe(50);
    });

    it("should handle undefined value", () => {
      const result = calculateMercuryHeight(
        undefined,
        minimum,
        maximum,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(0);
      expect(result.mercurySurfaceLevelY).toBe(250);
    });

    it("should handle different stem dimensions", () => {
      const value = mockDType(75);
      const customVerticalStemHeight = 400;
      const customTopOfStemY = 100;

      const result = calculateMercuryHeight(
        value,
        minimum,
        maximum,
        customVerticalStemHeight,
        customTopOfStemY
      );

      expect(result.mercuryHeight).toBe(300);
      expect(result.mercurySurfaceLevelY).toBe(200);
    });

    it("should handle different min/max ranges", () => {
      const value = mockDType(50);
      const customMin = 25;
      const customMax = 75;

      const result = calculateMercuryHeight(
        value,
        customMin,
        customMax,
        verticalStemHeight,
        topOfStemY
      );

      expect(result.mercuryHeight).toBe(100);
      expect(result.mercurySurfaceLevelY).toBe(150);
    });
  });

  describe("ThermometerComponent", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should render with mandatory props", () => {
      render(<ThermometerComponent {...mandatoryProps} />);

      expect(d3.select).toHaveBeenCalled();
      expect(d3.path).toHaveBeenCalled();
    });

    it("should render with custom props", () => {
      render(
        <ThermometerComponent
          value={mockValue}
          minimum={10}
          maximum={90}
          height={200}
          width={50}
          fillColor={Color.fromRgba(255, 0, 0, 1)}
          {...mandatoryProps}
        />
      );

      expect(d3.select).toHaveBeenCalled();
      expect(d3.path).toHaveBeenCalled();
    });
  });

  describe("SVG rendering", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("expect path append to have been called 3 times", () => {
      render(<ThermometerComponent {...mandatoryProps} />);

      expect(d3.path).toHaveBeenCalledTimes(2); // Once for outline, once for bulb

      // Verify that second path was appended
      const selectMock = d3.select as jest.Mock;
      const appendMock = selectMock.mock.results[0].value.append;

      expect(appendMock.mock.calls).toEqual([["path"], ["path"], ["rect"]]);
    });
  });
});
