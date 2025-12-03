import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CsWebLibHttpResponseError, httpRequest } from "./httpClient";

describe("CsWebLibHttpResponseError", () => {
  it("should create an error with the correct name", () => {
    const error = new CsWebLibHttpResponseError("Test error", 404);
    expect(error.name).toBe("CsWebLibHttpError");
  });

  it("should store the message passed to the constructor", () => {
    const errorMessage = "Test error message";
    const error = new CsWebLibHttpResponseError(errorMessage, 404);
    expect(error.message).toBe(errorMessage);
  });

  it("should store the HTTP response code", () => {
    const responseCode = 404;
    const error = new CsWebLibHttpResponseError("Test error", responseCode);
    expect(error.responseCode).toBe(responseCode);
  });

  it("should extend Error class", () => {
    const error = new CsWebLibHttpResponseError("Test error", 404);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("httpRequest", () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should call fetch on the URL", async () => {
    const testUrl = "https://diamond.ac.uk/api";
    const mockResponse = {
      status: 200,
      statusText: "OK"
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await httpRequest(testUrl);

    expect(mockFetch).toHaveBeenCalledWith(testUrl);
    expect(result).toBe(mockResponse);
  });

  it("should call fetch with the URL and init argument", async () => {
    const testUrl = "https://diamond.ac.uk/api";
    const initOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    };
    const mockResponse = {
      status: 201,
      statusText: "Created"
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await httpRequest(testUrl, initOptions);

    expect(mockFetch).toHaveBeenCalledWith(testUrl, initOptions);
    expect(result).toBe(mockResponse);
  });

  it("should throw CsWebLibHttpResponseError for 404 response", async () => {
    const testUrl = "https://diamond.ac.uk/api";
    const mockResponse = {
      status: 404,
      statusText: "Not Found"
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    await expect(httpRequest(testUrl)).rejects.toThrow(
      CsWebLibHttpResponseError
    );
  });
});
