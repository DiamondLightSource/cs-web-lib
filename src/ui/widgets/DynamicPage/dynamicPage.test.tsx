import React from "react";

import { waitFor } from "@testing-library/react";
import { DynamicPageComponent } from "./dynamicPage";
import { PageState } from "../../../misc/fileContext";
import { contextRender } from "../../../testResources";

import { ensureWidgetsRegistered } from "..";
import { vi } from "vitest";
ensureWidgetsRegistered();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Global {}
  }
}

interface GlobalFetch extends NodeJS.Global {
  fetch: any;
}
const globalWithFetch = global as GlobalFetch;

beforeEach((): void => {
  // Ensure the fetch() function mock is always cleared.
  vi.spyOn(globalWithFetch, "fetch").mockClear();
});

describe("<DynamicPage>", (): void => {
  it("shows placeholder if no page is loaded", () => {
    const { queryByText } = contextRender(
      <DynamicPageComponent location="testlocation" />,
      {},
      {}
    );
    expect(queryByText(/.*no file loaded/)).toBeInTheDocument();
  });

  it("loads a page", async (): Promise<void> => {
    const mockSuccessResponse =
      '{"type": "display", "position": "relative", "children": [ { "type": "label", "position": "relative", "text": "hello" } ] }';
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });
    const mockFetch = (): Promise<unknown> => mockFetchPromise;
    vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);

    const initialPageState: PageState = {
      testlocation: {
        path: "/json/test.json",
        macros: {},
        defaultProtocol: "pva"
      }
    };
    const { queryByText } = contextRender(
      <DynamicPageComponent location="testlocation" />,
      initialPageState
    );

    expect(queryByText("hello")).not.toBeInTheDocument();

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("/json/test.json");

    await waitFor((): void => {
      expect(queryByText("hello")).toBeInTheDocument();
    });
  });
});
