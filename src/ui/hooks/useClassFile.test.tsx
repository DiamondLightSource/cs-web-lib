import React from "react";
import { contextRender, createRootStoreState } from "../../testResources";
import { vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { ensureWidgetsRegistered } from "../widgets";
import { extractThemeProps, useClassFile } from "./useClassFile";
import { CsWebLibConfig } from "../../redux";
import { phoebusTheme } from "../../phoebusTheme";
import { createTheme } from "@mui/material";
import { CsState } from "../../redux/csState";
import { WidgetDescription } from "../widgets/createComponent";
import { newAbsolutePosition } from "../../types/position";
import { newFont } from "../../types/font";
import { newColor } from "../../types/color";

ensureWidgetsRegistered();

const CLASS_WIDGET: WidgetDescription = {
  type: "label",
  id: "123",
  fileId: "AShapeFilePath",
  name: "MY_CLASS",
  font: newFont(20),
  position: newAbsolutePosition("0", "0", "0", "0"),
  backgroundColor: newColor("rgba(56,206,56,1)"),
  foregroundColor: newColor("rgba(29,41,69,1)")
};

function getFileState(): CsState {
  return {
    valueCache: {},
    subscriptions: {},
    globalMacros: {},
    effectivePvNameMap: {},
    deviceCache: {},
    pvwsSettings: {}
  };
}

const initialState: CsWebLibConfig = {
  storeMode: "DEV",
  PVWS_SOCKET: "",
  PVWS_SSL: true,
  THROTTLE_PERIOD: 100,
  defaultMjpgEndpoint: "",
  csWebLibFeatureFlags: {
    enableDynamicScripts: false
  }
};

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

const ClassFileTester = (): JSX.Element => {
  const contents = useClassFile();
  return <div>contents: {JSON.stringify(contents.palette)}</div>;
};

describe("useClassFile", (): void => {
  it("returns default phoebus theme if no classfile", (): void => {
    const { getByText } = contextRender(
      <ClassFileTester />,
      {},
      {},
      createRootStoreState(getFileState(), undefined, undefined, initialState),
      {}
    );

    expect(
      getByText(`contents: ${JSON.stringify(phoebusTheme.palette)}`)
    ).toBeInTheDocument();
  });

  it("returns theme with classes if classfile", async (): Promise<void> => {
    const mockSuccessResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <display version="2.0.0">
        <name>Widget Classes</name>
        <y use_class="true">0</y>
        <widget type="action_button" version="3.0.0">
          <name>MY_CLASS</name>
          <x>390</x>
          <y>180</y>
          <foreground_color use_class="true">
            <color name="Text" red="0" green="0" blue="0">
            </color>
          </foreground_color>
          <background_color use_class="true">
            <color name="STOP" red="0" green="0" blue="255">
            </color>
          </background_color>
          <tooltip>$(actions)</tooltip>
          <font use_class="true">
            <font family="Montserrat" style="REGULAR" size="8.0">
            </font>
          </font>
          <border_width use_class="true">3</border_width>
          <border_color use_class="true">
            <color name="INVALID" red="255" green="0" blue="255">
            </color>
          </border_color>
        </widget>
      </display>`;
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });
    const mockFetch = (): Promise<unknown> => mockFetchPromise;
    vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);
    await act(async () => {
      contextRender(
        <ClassFileTester />,
        {},
        {},
        createRootStoreState(getFileState(), undefined, undefined, {
          classFile: "myclass.bcf",
          ...initialState
        }),
        {}
      );
    });

    const responseContent = JSON.stringify(
      createTheme({
        customName: "class",
        palette: {
          ...phoebusTheme.palette,
          ...{
            MY_CLASSactionbutton: {
              main: "rgba(0,0,255,1)",
              contrastText: "rgba(0,0,0,1)"
            }
          }
        }
      }).palette
    );
    expect(
      screen.getByText(`contents: ${responseContent}`)
    ).toBeInTheDocument();
  });
});

describe("extractThemeProps", (): void => {
  it("returns nothing if no props in list match", (): void => {
    const matches = extractThemeProps(
      CLASS_WIDGET,
      new Set(["offColor", "onColor"]),
      value => value.colorString
    );
    expect(matches).toEqual({});
  });
  it("returns nothing if the map function is wrong", (): void => {
    const matches = extractThemeProps(
      CLASS_WIDGET,
      new Set(["font"]),
      value => value.colorString
    );
    expect(matches).toEqual({});
  });
  it("filters out undefined values", (): void => {
    const newClassWidget = {
      ...CLASS_WIDGET,
      backgroundColor: { colorString: undefined }
    };
    const matches = extractThemeProps(
      newClassWidget,
      new Set(["backgroundColor", "foregroundColor"]),
      value => value.colorString
    );
    expect(matches).toEqual({ contrastText: "rgba(29,41,69,1)" });
  });
  it("returns a list of matches that are correctly mapped", (): void => {
    const matches = extractThemeProps(
      CLASS_WIDGET,
      new Set(["backgroundColor", "foregroundColor"]),
      value => value.colorString
    );
    expect(matches).toEqual({
      contrastText: "rgba(29,41,69,1)",
      main: "rgba(56,206,56,1)"
    });
  });
  it("returns a list of matches that don't need mapping", (): void => {
    const matches = extractThemeProps(
      CLASS_WIDGET,
      new Set(["font"]),
      value => value
    );
    expect(matches).toEqual({
      font: {
        name: undefined,
        size: 20,
        style: "Regular",
        typeface: "Liberation sans"
      }
    });
  });
});
