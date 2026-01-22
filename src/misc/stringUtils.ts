/**
 * Tries to convert a string that might be of the form "arrayName[i]" to an array name and index.
 * Returns the array name and index if the string matches the pattern otherwise returns undefined.
 * @param arrayString The array form  string to parse
 * @returns An array containing the name of the array and the index, or null if there is no match
 */
export const parseArrayString = (
  arrayString: string
): [string, number] | null => {
  try {
    const match = arrayString?.match(/^(.*)\[\s*(\d+)\s*\]$/);
    if (match) {
      const arrayName: string = match[1];
      const index = parseInt(match[2], 10);
      return [arrayName, index];
    }
  } catch {
    return null;
  }

  return null;
};
