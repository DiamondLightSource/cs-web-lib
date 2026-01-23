import { describe, it, expect } from "vitest";
import { parseArrayString } from "./stringUtils";

describe("parseArrayString", () => {
  it("parses a simple array string with index", () => {
    expect(parseArrayString("items[3]")).toEqual(["items", 3]);
  });

  it("parses array string with spaces inside brackets", () => {
    expect(parseArrayString("list[   10   ]")).toEqual(["list", 10]);
  });

  it("parses array names containing dots or multiple characters", () => {
    expect(parseArrayString("obj.prop[5]")).toEqual(["obj.prop", 5]);
  });

  it("returns null for missing brackets", () => {
    expect(parseArrayString("items")).toBeNull();
  });

  it("returns null for non-numeric index", () => {
    expect(parseArrayString("items[abc]")).toBeNull();
  });

  it("returns null for malformed array syntax", () => {
    expect(parseArrayString("items[1")).toBeNull();
    expect(parseArrayString("items1]")).toBeNull();
    expect(parseArrayString("items[]")).toBeNull();
  });

  it("returns null when input is an empty string", () => {
    expect(parseArrayString("")).toBeNull();
  });

  it("does not throw and returns null on unexpected errors", () => {
    // @ts-expect-error Testing error-handling fallback
    expect(parseArrayString(undefined)).toBeNull();
  });
});
