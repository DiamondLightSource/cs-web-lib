import { describe, expect, it } from "vitest";
import { buildUrl, isFullyQualifiedUrl } from "./urlUtils";

describe("urlUtils", () => {
  describe("isFullyQualifiedUrl", () => {
    it("should return true when url is valid", async () => {
      const result = isFullyQualifiedUrl("https://diamond.ac.uk:4000/path1");
      expect(result).toEqual(true);
    });

    it("should return false when url is undefined", async () => {
      // @ts-expect-error Testing undefined input
      const result = isFullyQualifiedUrl(undefined);
      expect(result).toEqual(false);
    });

    it("should return false when url is invalid", async () => {
      const result = isFullyQualifiedUrl("abcde1234.ac.uk");
      expect(result).toEqual(false);
    });
  });

  describe("buildUrl", () => {
    it("should use base url when the joined path args don't make a fully qualified URL", async () => {
      const baseUrl = "http://diamond.ac.uk";
      const args = ["path1"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://diamond.ac.uk/path1");
    });

    it("should return the default base url when the path args not specified", async () => {
      const baseUrl = "http://diamond.ac.uk";

      const result = buildUrl(baseUrl);

      expect(result).toEqual("http://diamond.ac.uk/");
    });

    it("should return the default base url when the only path arg is undefined", async () => {
      const baseUrl = "http://diamond.ac.uk";

      const result = buildUrl(baseUrl, undefined);

      expect(result).toEqual("http://diamond.ac.uk/");
    });

    it("url encodes the path string", async () => {
      const baseUrl = "http://diamond.ac.uk";
      const args = ["path 1"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://diamond.ac.uk/path%201");
    });

    it("removes trailing and leading slash", async () => {
      const baseUrl = "http://diamond.ac.uk/";
      const args = ["/path1/"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://diamond.ac.uk/path1");
    });

    it("Joins multiple path args with / separator", async () => {
      const baseUrl = "http://diamond.ac.uk";
      const args = ["/path1/", "/path2", "path3/"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://diamond.ac.uk/path1/path2/path3");
    });

    it("Joins multiple path args with / separator, ignores filename component of host path", async () => {
      const baseUrl = "http://diamond.ac.uk/path0/path2";
      const args = ["/path1/"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://diamond.ac.uk/path0/path2/path1");
    });

    it("Joins multiple path args with / separator, trailing slash on the url", async () => {
      const baseUrl = "http://diamond.ac.uk/path0/path1/";
      const args = ["/path10/", "/path20"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://diamond.ac.uk/path0/path1/path10/path20");
    });

    it("ignores default base url if the args start with a fully qualified url", async () => {
      const baseUrl = "http://diamond.ac.uk";
      const args = ["http://ral.ac.uk/", "path1", "path2"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("http://ral.ac.uk/path1/path2");
    });

    it("ignores default base url if the args start with a fully qualified url and even if the base Url contains a path", async () => {
      const baseUrl = "https://diamond.ac.uk/path0";
      const args = ["https://ral.ac.uk:4000/", "path1", "path2"];

      const result = buildUrl(baseUrl, ...args);

      expect(result).toEqual("https://ral.ac.uk:4000/path1/path2");
    });

    it("ignores default base url if the args start with a fully qualified url, when base url is invalid", async () => {
      const args = ["http://ral.ac.uk/", "path1", "path2"];

      const result = buildUrl("abcd", ...args);

      expect(result).toEqual("http://ral.ac.uk/path1/path2");
    });

    it("ignores default base url if the args start with a fully qualified url, when base url is undefined", async () => {
      const args = ["http://ral.ac.uk/", "path1", "path2"];

      // @ts-expect-error Testing undefined input
      const result = buildUrl(undefined, ...args);

      expect(result).toEqual("http://ral.ac.uk/path1/path2");
    });

    it("Returns a relative path if base url is an empty string and path is not a fully qualified URL", async () => {
      const args = ["path1", "filename.json"];

      const result = buildUrl("", ...args);

      expect(result).toEqual("path1/filename.json");
    });
  });
});
