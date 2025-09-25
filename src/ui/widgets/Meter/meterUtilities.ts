export enum NumberFormatEnum {
  Default = 1,
  Exponential = 2,
  Engineering = 3,
  Hexadecimal = 4
}

/**
 * Convert inf and NaN Number values to undefined
 * @param value The value
 * @returns The value or undefined if the original value was undefined, null, inf, or NaN
 */
export const convertInfAndNanToUndefined = (
  value: number | undefined
): number | undefined => {
  // u
  if (value === null || value === undefined) {
    return undefined;
  }

  return isFinite(value) ? value : undefined;
};

/**
 * Convert a number to a string of the given form, with or without the specified units
 * @param value The numerical value
 * @param numberFormat The format number
 * @param precision The desired precision
 * @param units the units
 * @param showUnits True if units are to be shown, default false no units shown
 * @returns The formatted value
 */
export const formatValue =
  (
    value: number,
    numberFormat: number,
    precision: number,
    units: string,
    showUnits = false
  ) =>
  (): string => {
    const maxPrecision = precision === -1 ? 3 : precision;
    let strVal = `${value}`;
    if (numberFormat === NumberFormatEnum.Exponential) {
      strVal = value.toExponential(maxPrecision - 1);
    } else if (numberFormat === NumberFormatEnum.Engineering) {
      strVal = value.toPrecision(maxPrecision);
    } else if (numberFormat === NumberFormatEnum.Hexadecimal) {
      strVal = `0x${Math.round(value).toString(16)}`;
    } else {
      strVal = value.toFixed(maxPrecision);
    }

    return showUnits ? `${strVal} ${units}` : strVal;
  };

/**
 * Creates the alert, warning and normal, colored sub arcs for the meter
 *
 * @param foregroundColor The minimum value of the range
 * @param maximum The maximum value of the range
 * @param minimum The minimum value of the range
 * @param alarmRangeMin The upper boundary of the low value alert range
 * @param warningRangeMin The upper boundary of the low value warning range
 * @param warningRangeMax The lower boundary of the high value warning range
 * @param alarmRangeMax The lower boundary of the high value alert range
 * @returns An array of sub arc for the meter
 */
export const buildSubArcs = (
  foregroundColor: string,
  minimum: number,
  maximum: number,
  alarmRangeMin: number | undefined,
  warningRangeMin: number | undefined,
  warningRangeMax: number | undefined,
  alarmRangeMax: number | undefined
) => {
  const subArcs = [];

  const withinBounds = (value: number) =>
    Math.min(maximum, Math.max(minimum, value));

  if (alarmRangeMin && alarmRangeMin > minimum) {
    subArcs.push({
      limit: withinBounds(alarmRangeMin),
      width: 0.04,
      showTick: false,
      color: "rgba(255, 0, 0, 1)"
    });
  }

  if (warningRangeMin && warningRangeMin > (alarmRangeMin ?? minimum)) {
    subArcs.push({
      limit: withinBounds(warningRangeMin),
      width: 0.04,
      showTick: false,
      color: "rgba(255, 128, 0, 1)"
    });
  }

  subArcs.push({
    limit: withinBounds(
      Math.min(warningRangeMax ?? maximum, alarmRangeMax ?? maximum)
    ),
    width: 0.02,
    showTick: false,
    color: foregroundColor
  });

  if (warningRangeMax && warningRangeMax < (alarmRangeMax ?? maximum)) {
    subArcs.push({
      limit: withinBounds(alarmRangeMax ?? maximum),
      width: 0.04,
      showTick: false,
      color: "rgba(255, 128, 0, 1)"
    });
  }

  if (alarmRangeMax && alarmRangeMax < maximum) {
    subArcs.push({
      limit: withinBounds(maximum),
      width: 0.04,
      showTick: false,
      color: "rgba(255, 0, 0, 1)"
    });
  }

  return subArcs;
};

/**
 * Creates interval boundaries between min and max values
 *
 * @param min The minimum value of the range
 * @param max The maximum value of the range
 * @returns An array of interval boundary values
 */
export const createIntervals = (min: number, max: number): number[] => {
  if (min >= max) {
    throw new Error("Minimum value must be less than maximum value");
  }

  const range = max - min;

  // Tiny ranges
  if (range < Number.EPSILON) {
    return [min, max];
  }

  // Determine the scale factor based on the range
  let scale = 1;
  let decimalPlaces = 1;

  if (range < 1) {
    // For decimal ranges, find how many decimal places we need
    decimalPlaces = Math.ceil(Math.abs(Math.log10(range)));
    scale = Math.pow(10, decimalPlaces);
  }

  // Scale up the values to work with integers
  const scaledMin = min * scale;
  const scaledMax = max * scale;
  const scaledRange = scaledMax - scaledMin;

  // Find the appropriate "nice" step size
  const candidateSteps = findNiceStepSizes(scaledRange);

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestIntervals: number[] = [];

  for (const step of candidateSteps) {
    const intervals = generateIntervals(scaledMin, scaledMax, step);

    const score = scoreIntervals(intervals.length);

    if (score > bestScore) {
      bestScore = score;
      bestIntervals = intervals;
    }
  }

  return bestIntervals.map(val => Number((val / scale).toFixed(decimalPlaces)));
};

const findNiceStepSizes = (range: number): number[] => {
  const targetIntervals = 10;
  const roughStepSize = range / targetIntervals;

  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStepSize)));

  return [
    0.5 * magnitude,
    1 * magnitude,
    2 * magnitude,
    2.5 * magnitude,
    5 * magnitude,
    10 * magnitude
  ].filter(step => step > 0);
};

const generateIntervals = (
  min: number,
  max: number,
  step: number
): number[] => {
  const intervals: number[] = [];

  intervals.push(min);

  let current = Math.ceil(min / step) * step;
  if (Math.abs(current - min) < step * 0.1) {
    // If very close to min, move to next step
    current += step;
  }

  // Add points at step intervals
  while (current < max && intervals.length < 20) {
    intervals.push(current);
    current += step;
  }

  if (intervals[intervals.length - 1] !== max) {
    intervals.push(max);
  }

  return intervals;
};

const scoreIntervals = (count: number): number => {
  // Ideal
  if (count >= 8 && count <= 16) {
    return 100 - Math.abs(10 - count);
  }

  // Acceptable
  if (count >= 5 && count <= 21) {
    return 90 - Math.abs(10 - count);
  }

  // too many or too few intervals
  return 80 - Math.abs(10 - count);
};
