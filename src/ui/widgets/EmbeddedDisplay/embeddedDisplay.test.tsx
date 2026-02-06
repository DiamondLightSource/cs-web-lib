import React from "react";
import log from "loglevel";
import { EmbeddedDisplay } from "./embeddedDisplay";
import { waitFor, screen } from "@testing-library/react";
import { newRelativePosition } from "../../../types/position";
import { contextRender } from "../../../testResources";
import { ensureWidgetsRegistered } from "..";
import { vi } from "vitest";
import * as useRulesModule from "../../hooks/useRules";

ensureWidgetsRegistered();

interface GlobalFetch extends NodeJS.Global {
  fetch: any;
}
const globalWithFetch = global as GlobalFetch;

vi.mock("../../hooks/useRules", () => ({
  useRules: vi.fn()
}));
vi.mocked(useRulesModule.useRules).mockImplementation(props => props);

beforeEach((): void => {
  // Ensure the fetch() function mock is always cleared.
  vi.spyOn(globalWithFetch, "fetch").mockClear();
  vi.mocked(useRulesModule.useRules).mockClear();
});

describe("<EmbeddedDisplay>", (): void => {
  it.each<any>([
    ["/TestFile.bob", "/TestFile.bob"],
    ["https://a.com/b.bob", "https://a.com/b.bob"],
    ["/json/TestFile.json", "/json/TestFile.json"],
    ["https://a.com/b.json", "https://a.com/b.json"],
    ["/TestFile.opi", "/TestFile.opi"],
    ["https://a.com/b.opi", "https://a.com/b.opi"]
  ] as [string, string][])(
    "fetches a file from the server",
    async (inputFile: string, resolvedFile: string): Promise<void> => {
      const mockSuccessResponse = {};
      const mockTextPromise = Promise.resolve(mockSuccessResponse);
      const mockFetchPromise = Promise.resolve({
        text: (): Promise<unknown> => mockTextPromise
      });
      vi.spyOn(globalWithFetch, "fetch").mockImplementation(
        (): Promise<unknown> => mockFetchPromise
      );

      const props = {
        position: newRelativePosition(),
        file: {
          path: inputFile,
          defaultProtocol: "ca",
          macros: {}
        }
      };

      // Suppress logging for expected error.
      log.setLevel("error");
      const { queryByText } = contextRender(<EmbeddedDisplay {...props} />);

      expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
      expect(globalWithFetch.fetch).toHaveBeenCalledWith(resolvedFile);

      await waitFor((): void => {
        expect(vi.mocked(useRulesModule.useRules)).toHaveBeenCalledWith(
          expect.objectContaining(props)
        );

        expect(queryByText(/Error parsing.*/)).toBeInTheDocument();
      });
      log.setLevel("info");
    }
  );
  it("returns an error label when embedding a widget only", async (): Promise<void> => {
    const mockSuccessResponse = `
    <widget type="label" version="2.0.0">
        <name>Label</name>
        <text>From .bob file</text>
        <x>30</x>
        <y>10</y>
        <width>140</width>
    </widget>`;
    const mockTextPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockTextPromise
    });

    vi.spyOn(globalWithFetch, "fetch").mockImplementation(
      (): Promise<unknown> => mockFetchPromise
    );

    // Suppress logging for expected error.
    log.setLevel("error");
    const { queryByText } = contextRender(
      <EmbeddedDisplay
        position={newRelativePosition()}
        file={{
          path: "/TestFile1.bob",
          defaultProtocol: "ca",
          macros: {}
        }}
      />,
      {},
      {}
    );

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("/TestFile1.bob");

    await waitFor((): void =>
      expect(queryByText(/Error parsing.*/)).toBeInTheDocument()
    );
    log.setLevel("info");
  });

  it("converts a display with child widget", async (): Promise<void> => {
    const mockSuccessResponse = `
    <?xml version="1.0" encoding="UTF-8"?>
    <display version="2.0.0">
        <name>Display</name>
        <width>200</width>
        <height>350</height>
        <widget type="label" version="2.0.0">
            <name>Label</name>
            <text>From .bob file</text>
            <x>30</x>
            <y>10</y>
            <width>140</width>
        </widget>
    </display>`;
    const mockTextPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockTextPromise
    });

    vi.spyOn(globalWithFetch, "fetch").mockImplementation(
      (): Promise<unknown> => mockFetchPromise
    );

    const { queryByText } = contextRender(
      <EmbeddedDisplay
        position={newRelativePosition()}
        file={{
          path: "/TestFile2.bob",
          defaultProtocol: "ca",
          macros: {}
        }}
      />,
      {},
      {}
    );

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("/TestFile2.bob");

    await waitFor((): void =>
      expect(queryByText("From .bob file")).toBeInTheDocument()
    );
  });

  it("converts fetched children to JSON", async (): Promise<void> => {
    const mockSuccessResponse =
      '{ "type": "display", "position": "relative", "children": [{ "type": "label", "position": "relative", "text": "Test" }] }';
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });

    vi.spyOn(globalWithFetch, "fetch").mockImplementation(
      (): Promise<unknown> => mockFetchPromise
    );

    const { queryByText } = contextRender(
      <EmbeddedDisplay
        position={newRelativePosition()}
        file={{
          path: "/TestFile3.json",
          defaultProtocol: "ca",
          macros: {}
        }}
      />,
      {},
      {}
    );

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("/TestFile3.json");

    await waitFor((): void => expect(queryByText("Test")).toBeInTheDocument());
  });

  it("selects specific group from fetched children, when group is specified", async (): Promise<void> => {
    const mockSuccessResponse = {
      type: "display",
      name: "embedded_display",
      position: "absolute",
      x: 10,
      y: 20,
      width: 600,
      height: 700,
      children: [
        {
          type: "groupbox",
          name: "group_name_1",
          position: "absolute",
          x: 20,
          y: 30,
          width: 400,
          height: 500,
          children: [
            {
              type: "label",
              position: "relative",
              text: "Test group 1"
            }
          ]
        },
        {
          type: "groupbox",
          name: "group_name_2",
          position: "absolute",
          x: 220,
          y: 230,
          width: 240,
          height: 250,
          children: [
            {
              type: "label",
              position: "relative",
              text: "Test group 2"
            }
          ]
        }
      ]
    };

    const mockJsonPromise = Promise.resolve(
      JSON.stringify(mockSuccessResponse)
    );
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });

    vi.spyOn(globalWithFetch, "fetch").mockImplementation(
      (): Promise<unknown> => mockFetchPromise
    );

    const { container, queryByText } = contextRender(
      <EmbeddedDisplay
        position={newRelativePosition()}
        name={"Top_Display"}
        groupName={"group_name_2"}
        file={{
          path: "/TestFile3.json",
          defaultProtocol: "ca",
          macros: {}
        }}
      />,
      {},
      {}
    );

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("/TestFile3.json");

    await screen.findByText("Test group 2");
    // Second group should not be present
    expect(queryByText("Test group 1")).not.toBeInTheDocument();

    const display = container.querySelector(".display");
    expect(display).not.toBeNull();
    const innerDisplayWidgetWrapper = display?.firstElementChild;
    expect(innerDisplayWidgetWrapper).toHaveStyle("position: absolute");

    // This should match the size of the selected group
    expect(innerDisplayWidgetWrapper).not.toBeNull();
    expect(innerDisplayWidgetWrapper).toHaveStyle("top: 0px");
    expect(innerDisplayWidgetWrapper).toHaveStyle("left: 0px");
    expect(innerDisplayWidgetWrapper).toHaveStyle("height: 250px");
    expect(innerDisplayWidgetWrapper).toHaveStyle("width: 240px");

    const displayInner = display?.querySelector(".display");
    expect(displayInner).not.toBeNull();
    const groupBoxWidgetWrapper = displayInner?.firstChild;
    expect(groupBoxWidgetWrapper).toHaveStyle("position: absolute");
    expect(groupBoxWidgetWrapper).toHaveStyle("height: 250px");
    expect(groupBoxWidgetWrapper).toHaveStyle("width: 240px");
    // Positioned at top left irrespective of specified coordinates
    expect(groupBoxWidgetWrapper).toHaveStyle("top: 0");
    expect(groupBoxWidgetWrapper).toHaveStyle("left: 0");
  });

  it("selects specific group from fetched children, when group is specified by macro name", async (): Promise<void> => {
    const mockSuccessResponse = {
      type: "display",
      name: "embedded_display",
      position: "absolute",
      x: 10,
      y: 20,
      width: 600,
      height: 700,
      children: [
        {
          type: "groupbox",
          name: "group_name_1",
          position: "absolute",
          x: 20,
          y: 30,
          width: 400,
          height: 500,
          children: [
            {
              type: "label",
              position: "relative",
              text: "Test group 1"
            }
          ]
        },
        {
          type: "groupbox",
          name: "$(MACRO_GROUP_NAME)",
          position: "absolute",
          x: 220,
          y: 230,
          width: 240,
          height: 250,
          children: [
            {
              type: "label",
              position: "relative",
              text: "Test group 2"
            }
          ]
        }
      ]
    };

    const mockJsonPromise = Promise.resolve(
      JSON.stringify(mockSuccessResponse)
    );
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });

    vi.spyOn(globalWithFetch, "fetch").mockImplementation(
      (): Promise<unknown> => mockFetchPromise
    );

    const { queryByText } = contextRender(
      <EmbeddedDisplay
        position={newRelativePosition()}
        name={"Top_Display"}
        groupName={"$(MACRO_GROUP_NAME)"}
        file={{
          path: "/TestFile3.json",
          defaultProtocol: "ca",
          macros: { MACRO_GROUP_NAME: "a_group_name_specified_by_macro" }
        }}
      />,
      {},
      {}
    );

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("/TestFile3.json");

    await waitFor((): void => {
      expect(queryByText("Test group 2")).toBeInTheDocument();
      // Second group should not be present
      expect(queryByText("Test group 1")).not.toBeInTheDocument();
    });
  });

  it("Applies macros to filename before loading the embedded display file", async (): Promise<void> => {
    const mockSuccessResponse = {
      type: "display",
      name: "embedded_display",
      position: "absolute",
      x: 10,
      y: 20,
      width: 600,
      height: 700,
      children: []
    };

    const mockJsonPromise = Promise.resolve(
      JSON.stringify(mockSuccessResponse)
    );
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });

    vi.spyOn(globalWithFetch, "fetch").mockImplementation(
      (): Promise<unknown> => mockFetchPromise
    );

    contextRender(
      <EmbeddedDisplay
        position={newRelativePosition()}
        name={"Top_Display"}
        groupName={"group_name_2"}
        file={{
          path: "$(MACRO_FILENAME)",
          defaultProtocol: "ca",
          macros: { MACRO_FILENAME: "aBobFile.bob" }
        }}
      />,
      {},
      {}
    );

    expect(globalWithFetch.fetch).toHaveBeenCalledTimes(1);
    expect(globalWithFetch.fetch).toHaveBeenCalledWith("aBobFile.bob");
  });
});
