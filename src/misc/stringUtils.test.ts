import { describe, it, expect, vi } from "vitest";
import { generateUUID, parseArrayString } from "./stringUtils";

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

describe("generateUUID", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses crypto.randomUUID when available", () => {
    const mockUUID = "123e4567-e89b-42d3-a456-426614174000";

    const randomUUIDSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue(mockUUID);

    expect(generateUUID()).toBe(mockUUID);
    expect(randomUUIDSpy).toHaveBeenCalledOnce();
  });

  it("falls back to crypto.getRandomValues when randomUUID is unavailable", () => {
    const randomUUIDSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockImplementation(() => {
        throw new Error("Should not be called");
      });

    // make randomuuid unavailable
    Object.defineProperty(crypto, "randomUUID", {
      configurable: true,
      value: undefined
    });

    const mockBytes = new Uint8Array(16).fill(0);
    const getRandomValuesSpy = vi
      .spyOn(crypto, "getRandomValues")
      .mockImplementation(array => {
        (array as Uint8Array).set(mockBytes);
        return array;
      });

    const uuid = generateUUID();

    expect(getRandomValuesSpy).toHaveBeenCalledOnce();
    expect(uuid).toBe("00000000-0000-4000-8000-000000000000");
    randomUUIDSpy.mockRestore(); // restore original
  });

  it("generates a valid UUID v4 format", () => {
    // We want to test this since we are manually creating the other uuid
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("generates unique UUIDs on consecutive calls", () => {
    const firstUUID = generateUUID();
    const secondUUID = generateUUID();

    expect(firstUUID).not.toBe(secondUUID);
  });
});
