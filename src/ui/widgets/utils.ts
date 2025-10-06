/**
 * Converts string from snake case to camel
 * case.
 * @param text string to convert
 * @param start first index of string to convert
 * @param end final index of string to convert
 * @returns newly formatted string
 */
export function snakeCaseToCamelCase(
  text: string,
  start?: number | undefined,
  end?: number | undefined
): string | undefined {
  // Remove unneeded characters then split string by underscore
  const stringArray = (start && end ? text.slice(start, end) : text).split("_");
  // Remove first element, this shouldn't be uppercase
  let newName = stringArray.shift();
  // Loop over and capitalise first character of each string
  stringArray.forEach((word: string) => {
    newName += word.charAt(0).toUpperCase() + word.slice(1);
  });
  return newName;
}

/**
 * Round a decimal value up or down to the nearest
 * significant figure.
 * @param value decimal value to round
 * @param mag magnitude to round to
 * @param roundType 0 to round down, 1 to round up
 * @returns rounded number
 */
export function roundValue(value: number, roundType: number): number {
  // Can't find magnitude of 0 so skip
  if (value === 0) return value;
  // Need to use Math.abs to remove negative numbers
  const mag = Math.floor(Math.log(Math.abs(value)) / Math.log(10));
  // Round up or down depending on if it is max or min
  if (roundType) {
    return parseFloat(
      (Math.ceil(value / Math.pow(10, mag)) * Math.pow(10, mag)).toPrecision(
        Math.abs(mag) + 1
      )
    );
  }
  return parseFloat(
    (Math.floor(value / Math.pow(10, mag)) * Math.pow(10, mag)).toPrecision(
      Math.abs(mag) + 1
    )
  );
}

/**
 * If the height/width string contains "px" or font size
 * string contains "rem", remove it and convert value to
 * number.
 */
export function trimFromString(value: string): number {
  let num = 0;
  if (typeof value === "string") {
    if (value.includes("px")) num = Number(value.slice(0, -2));
    if (value.includes("rem")) num = Number(value.slice(0, -3)) * 10;
  }
  return num;
}

/**
 * Return the value of an optional parameter that may be undefined.
 * If it is undefined (i.e. not set) then return the default value
 * (defValue) provided in the input.
 * @param optionalParam parameter to get value from
 * @param defValue default value if optionalParam is undefined
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getOptionalValue(optionalParam: any, defValue: any): any {
  return typeof optionalParam === "undefined" ? defValue : optionalParam;
}

/**
 * Returns the corrected width and height for a rotated widget along
 * with its calculated transform string.
 * @param rotationStep 0 | 1 | 2 | 3
 * @param inputWidth current width of the widget
 * @param inputHeight current height of the widget
 * @returns an array containing the new width, height, and transform string
 */
export function calculateRotationTransform(
  rotationStep: number,
  inputWidth: number | string,
  inputHeight: number | string
): [
  outputWidth: number | string,
  outputHeight: number | string,
  transform: string
] {
  const outputWidth =
    rotationStep === 0 || rotationStep === 2 ? inputWidth : inputHeight;
  const outputHeight =
    rotationStep === 0 || rotationStep === 2 ? inputHeight : inputWidth;
  const transform = (function () {
    if (typeof inputHeight === "number" && typeof inputWidth === "number") {
      const offset = inputWidth / 2 - inputHeight / 2;
      switch (rotationStep) {
        case 0: // 0 degrees
        case 2: // 180 degrees
          return `rotate(${rotationStep * -90}deg)`;
        case 1: // 90 degrees
          return `rotate(${rotationStep * -90}deg) translateY(${offset}px) translateX(${offset}px)`;
        case 3: // -90 degrees
          return `rotate(${rotationStep * -90}deg) translateY(${-offset}px) translateX(${-offset}px)`;
        default: // Unreachable
          return "";
      }
    }
    // If height and width are not provided in pixels, we cannot accurately perform a transform
    return "";
  })();
  return [outputWidth, outputHeight, transform];
}

/**
 * Function that converts strings containing a time interval
 * into time in milliseconds
 * @param period string datetime
 * @returns period of time in milliseconds
 */
export function convertStringTimePeriod(period: string): number {
  // Array of all time period strings
  const times = ["second", "minute", "day", "week", "month", "year"];
  let exponent = times.findIndex(time => period.includes(time));
  // If this fails, just use default value of 1 minute
  if (exponent === undefined || exponent === -1) exponent = 1;
  // Find number of time period
  const multiplier = parseInt(period.replace(times[exponent], "").trim());
  // If multiplier can't be parsed, default again to 1 minute, and calculate time
  const time =
    (isNaN(multiplier) ? 1 : multiplier) * Math.pow(60, exponent) * 1000;
  return time;
}
