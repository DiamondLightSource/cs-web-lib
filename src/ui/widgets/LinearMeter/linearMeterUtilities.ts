import { colorChangeAlpha, ColorUtils, newColor } from "../../../types/color";

interface Colors {
  normalStatusColor?: string | null;
  minorWarningColor?: string | null;
  majorWarningColor?: string | null;
  isHighlightingOfActiveRegionsEnabled?: boolean | null;
}

export const buildStatusRegions = (
  levelLolo: number | undefined,
  levelLow: number | undefined,
  levelHigh: number | undefined,
  levelHihi: number | undefined,
  minimum: number,
  maximum: number,
  colors: Colors,
  showLimits: boolean,
  numValue: number
): { minimum: number; maximum: number; fill: string }[] => {
  const normalStatusColor =
    colors?.normalStatusColor ??
    ColorUtils.fromRgba(194, 198, 195, 1).colorString;
  const minorWarningColor =
    colors?.minorWarningColor ??
    ColorUtils.fromRgba(242, 148, 141, 1).colorString;
  const majorWarningColor =
    colors?.majorWarningColor ??
    ColorUtils.fromRgba(240, 60, 46, 1).colorString;
  const isHighlightingOfActiveRegionsEnabled =
    colors?.isHighlightingOfActiveRegionsEnabled ?? true;

  const statusRegions: { minimum: number; maximum: number; fill: string }[] =
    [];

  if (!showLimits) {
    statusRegions.push({
      minimum,
      maximum,
      fill: normalStatusColor
    });
    return statusRegions;
  }

  // This is an array of level limits and their colors
  const regionDefinitions = [
    { level: levelLolo, color: majorWarningColor },
    { level: levelLow, color: minorWarningColor },
    { level: levelHigh, color: normalStatusColor },
    { level: levelHihi, color: minorWarningColor },
    { level: levelHihi == null ? undefined : maximum, color: majorWarningColor }
  ];

  let lowerBound: number = minimum;

  for (const { level, color } of regionDefinitions) {
    const region = createRegion(
      level,
      lowerBound,
      maximum,
      color,
      isHighlightingOfActiveRegionsEnabled,
      numValue
    );

    if (region) {
      statusRegions.push(region);
      lowerBound = region.maximum;
    }
  }

  return statusRegions;
};

const createRegion = (
  regionLimit: number | undefined,
  lowerBound: number,
  maximum: number,
  regionColor: string,
  isHighlightingOfActiveRegionsEnabled: any,
  numValue: number
): { minimum: number; maximum: number; fill: string } | null => {
  const alpha = 0.1;

  if (regionLimit != null && regionLimit > lowerBound && lowerBound < maximum) {
    let color = regionColor;
    if (
      isHighlightingOfActiveRegionsEnabled &&
      (numValue > regionLimit || numValue <= lowerBound)
    ) {
      color = colorChangeAlpha(newColor(color), alpha).colorString;
    }

    const upperBound = Math.min(maximum, regionLimit);

    return {
      minimum: lowerBound,
      maximum: upperBound,
      fill: color
    };
  }

  return null;
};
