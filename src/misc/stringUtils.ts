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

/**
 * Generate a uuid. crypot.randomUUID is not available in insecure
 * (http) contexts, so we fall back to .getRandomValues instead
 */
export function generateUUID(): string {
  // If defined as a function in this context, we can use it
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join("")
  ].join("-");
}
