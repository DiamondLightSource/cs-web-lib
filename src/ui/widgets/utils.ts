/**
 * Converts string from snake case to camel
 * case.
 * @param text string to convert
 * @param sliceIdx number to slice at and remove elements
 * @returns newly formatted string
 */
export function snakeCaseToCamelCase(
  text: string,
  start = undefined,
  end = undefined
): string | undefined {
  // Split string by underscore
  const stringArray = text.split("_").slice(start, end);
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
