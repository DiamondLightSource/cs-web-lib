import { describe, it, expect } from "vitest";
import { buildStatusRegions } from "./linearMeterUtilities";
import { Color } from "../../../types";

describe("buildStatusRegions", () => {
  const mockColors = () => ({
    normalStatusColor: Color.fromRgba(194, 198, 195, 1),
    minorWarningColor: Color.fromRgba(242, 148, 141, 1),
    majorWarningColor: Color.fromRgba(240, 60, 46, 1),
    isHighlightingOfActiveRegionsEnabled: true
  });

  it("should return a single band with normal color when showLimits is false", () => {
    const colors = mockColors();
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      0,
      100,
      colors,
      false,
      50
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      minimum: 0,
      maximum: 100,
      fill: colors.normalStatusColor.toString()
    });
  });

  it("should create correct bands when all levels are defined and value is in normal range", () => {
    const colors = mockColors();
    const result = buildStatusRegions(10, 20, 80, 90, 0, 100, colors, true, 50);

    expect(result).toHaveLength(5);

    expect(result[0]).toEqual({
      minimum: 0,
      maximum: 10,
      fill: colors.majorWarningColor.changeAlpha(0.1).toString()
    });

    expect(result[1]).toEqual({
      minimum: 10,
      maximum: 20,
      fill: colors.minorWarningColor.changeAlpha(0.1).toString()
    });

    expect(result[2]).toEqual({
      minimum: 20,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });

    expect(result[3]).toEqual({
      minimum: 80,
      maximum: 90,
      fill: colors.minorWarningColor.changeAlpha(0.1).toString()
    });

    expect(result[4]).toEqual({
      minimum: 90,
      maximum: 100,
      fill: colors.majorWarningColor.changeAlpha(0.1).toString()
    });
  });

  it("should highlight LOLO band when value is in LOLO range", () => {
    const colors = mockColors();
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      0,
      100,
      mockColors,
      true,
      5
    );

    expect(result[0].fill).toEqual(colors.majorWarningColor.toString());
    expect(result[1].fill).toEqual(
      colors.minorWarningColor.changeAlpha(0.1).toString()
    );
  });

  it("should highlight LOW band when value is in LOW range", () => {
    const colors = mockColors();

    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      0,
      100,
      mockColors,
      true,
      15
    );

    expect(result[0].fill).toEqual(
      colors.majorWarningColor.changeAlpha(0.1).toString()
    );
    expect(result[1].fill).toEqual(colors.minorWarningColor.toString());
  });

  it("should highlight HIGH band when value is in HIGH range", () => {
    const colors = mockColors();
    const result = buildStatusRegions(10, 20, 80, 90, 0, 100, colors, true, 85);

    expect(result[2].fill).toEqual(
      colors.normalStatusColor.changeAlpha(0.1).toString()
    );
    expect(result[3].fill).toEqual(colors.minorWarningColor.toString());
  });

  it("should highlight HIHI band when value is in HIHI range", () => {
    const colors = mockColors();
    const result = buildStatusRegions(10, 20, 80, 90, 0, 100, colors, true, 95);

    expect(result[3].fill).toEqual(
      colors.minorWarningColor.changeAlpha(0.1).toString()
    );
    expect(result[4].fill).toEqual(colors.majorWarningColor.toString());
  });

  it("should handle undefined levels correctly", () => {
    const colors = mockColors();
    const result = buildStatusRegions(
      undefined,
      20,
      80,
      undefined,
      0,
      100,
      mockColors,
      true,
      50
    );

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      minimum: 0,
      maximum: 20,
      fill: colors.minorWarningColor.changeAlpha(0.1).toString()
    });

    expect(result[1]).toEqual({
      minimum: 20,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });
  });

  it("should handle levels that are not increasing", () => {
    const colors = mockColors();
    const result = buildStatusRegions(20, 10, 80, 90, 0, 100, colors, true, 50);

    expect(result).toHaveLength(4);

    expect(result[0]).toEqual({
      minimum: 0,
      maximum: 20,
      fill: colors.majorWarningColor.changeAlpha(0.1).toString()
    });

    expect(result[1]).toEqual({
      minimum: 20,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });

    expect(result[2]).toEqual({
      minimum: 80,
      maximum: 90,
      fill: colors.minorWarningColor.changeAlpha(0.1).toString()
    });

    expect(result[3]).toEqual({
      minimum: 90,
      maximum: 100,
      fill: colors.majorWarningColor.changeAlpha(0.1).toString()
    });
  });

  it("should use custom colors when provided", () => {
    const customColors = {
      normalStatusColor: Color.fromRgba(100, 100, 100, 1),
      minorWarningColor: Color.fromRgba(150, 150, 150, 1),
      majorWarningColor: Color.fromRgba(200, 200, 200, 1),
      isHighlightingOfActiveRegionsEnabled: true
    };

    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      0,
      100,
      customColors,
      true,
      50
    );

    expect(result[0].fill).toEqual(
      customColors.majorWarningColor.changeAlpha(0.1).toString()
    );
    expect(result[1].fill).toEqual(
      customColors.minorWarningColor.changeAlpha(0.1).toString()
    );
    expect(result[2].fill).toEqual(customColors.normalStatusColor.toString());
  });

  it("should not change alpha when highlighting is disabled", () => {
    const noHighlightColors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };

    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      0,
      100,
      noHighlightColors,
      true,
      50
    );

    expect(result[0].fill).toEqual(
      noHighlightColors.majorWarningColor.toString()
    );
    expect(result[1].fill).toEqual(
      noHighlightColors.minorWarningColor.toString()
    );
    expect(result[2].fill).toEqual(
      noHighlightColors.normalStatusColor.toString()
    );
  });

  it("should respect minimum and maximum bounds", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(10, 20, 80, 90, 15, 85, colors, true, 50);

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      minimum: 15,
      maximum: 20,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 20,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });

    expect(result[2]).toEqual({
      minimum: 80,
      maximum: 85,
      fill: colors.minorWarningColor.toString()
    });
  });

  it("should give only low major alarm region when maximum and minimum less than lolo", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(10, 20, 80, 90, -10, 5, colors, true, 50);

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      minimum: -10,
      maximum: 5,
      fill: colors.majorWarningColor.toString()
    });
  });

  it("should give only low major and low minor regions when minimum less than lolo and maximum less than low", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      -10,
      15,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      minimum: -10,
      maximum: 10,
      fill: colors.majorWarningColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 10,
      maximum: 15,
      fill: colors.minorWarningColor.toString()
    });
  });

  it("should give low major, low minor and normal regions when minimum less than lolo and maximum less than high", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      -10,
      50,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      minimum: -10,
      maximum: 10,
      fill: colors.majorWarningColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 10,
      maximum: 20,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[2]).toEqual({
      minimum: 20,
      maximum: 50,
      fill: colors.normalStatusColor.toString()
    });
  });

  it("should give low major, low minor, high minor alarm and normal regions when minimum less than lolo and maximum less than hihi", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      -10,
      85,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(4);

    expect(result[0]).toEqual({
      minimum: -10,
      maximum: 10,
      fill: colors.majorWarningColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 10,
      maximum: 20,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[2]).toEqual({
      minimum: 20,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });

    expect(result[3]).toEqual({
      minimum: 80,
      maximum: 85,
      fill: colors.minorWarningColor.toString()
    });
  });

  it("should give only high major alarm region when minimum greater than hihi and maximum greater than hihi", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      95,
      150,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      minimum: 95,
      maximum: 150,
      fill: colors.majorWarningColor.toString()
    });
  });

  it("should give high major and minor alarm regions when minimum less than hihi and maximum greater than hihi", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      85,
      150,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      minimum: 85,
      maximum: 90,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 90,
      maximum: 150,
      fill: colors.majorWarningColor.toString()
    });
  });

  it("should give high major and minor alarm and normal regions when minimum less than high and maximum greater than hihi", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      50,
      150,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      minimum: 50,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 80,
      maximum: 90,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[2]).toEqual({
      minimum: 90,
      maximum: 150,
      fill: colors.majorWarningColor.toString()
    });
  });

  it("should give high major, high minor, low minor and normal regions when minimum less than low and maximum greater than hihi", () => {
    const colors = {
      ...mockColors(),
      isHighlightingOfActiveRegionsEnabled: false
    };
    const result = buildStatusRegions(
      10,
      20,
      80,
      90,
      15,
      150,
      colors,
      true,
      50
    );

    expect(result).toHaveLength(4);

    expect(result[0]).toEqual({
      minimum: 15,
      maximum: 20,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[1]).toEqual({
      minimum: 20,
      maximum: 80,
      fill: colors.normalStatusColor.toString()
    });

    expect(result[2]).toEqual({
      minimum: 80,
      maximum: 90,
      fill: colors.minorWarningColor.toString()
    });

    expect(result[3]).toEqual({
      minimum: 90,
      maximum: 150,
      fill: colors.majorWarningColor.toString()
    });
  });
});
