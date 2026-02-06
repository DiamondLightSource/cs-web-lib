import React from "react";
import { contextRender } from "../../testResources";
import { CsState } from "../../redux/csState";
import { File, useFile } from "./useFile";
import { Color } from "../../types";
import { vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { ensureWidgetsRegistered } from "../widgets";
import { newAbsolutePosition, PositionType } from "../../types/position";
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

const FileTester = (props: { file: File }): JSX.Element => {
  const contents = useFile(props.file);
  return <div>contents: {JSON.stringify(contents)}</div>;
};

function getFileState(): CsState {
  return {
    valueCache: {},
    subscriptions: {},
    globalMacros: {},
    effectivePvNameMap: {},
    deviceCache: {},
    fileCache: {}
  };
}

describe("useFile", (): void => {
  it("returns empty widget if file not in cache", (): void => {
    const initialState = getFileState();
    const { getByText } = contextRender(
      <FileTester
        file={{ path: "test.bob", defaultProtocol: "ca", macros: {} }}
      />,
      {},
      {},
      initialState
    );

    const responseContent = JSON.stringify({
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    });

    expect(getByText(`contents: ${responseContent}`)).toBeInTheDocument();
  });

  it("returns contents if file in cache", async (): Promise<void> => {
    const mockSuccessResponse = JSON.stringify({
      type: "ellipse",
      backgroundColor: Color.GREEN,
      position: undefined
    });
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockJsonPromise
    });
    const mockFetch = (): Promise<unknown> => mockFetchPromise;
    vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);
    const initialState = getFileState();
    await act(async () => {
      contextRender(
        <FileTester
          file={{ path: "test.json", defaultProtocol: "ca", macros: {} }}
        />,
        {},
        {},
        initialState
      );
    });

    const responseContent = JSON.stringify({
      type: "ellipse",
      position: {
        x: "",
        y: "",
        width: "",
        height: "",
        margin: "",
        padding: "",
        minWidth: "",
        maxWidth: "",
        minHeight: "",
        positionType: PositionType.RELATIVE
      },
      backgroundColor: { text: { text: "rgba(0,128,0,1)" } },
      children: [],
      precisionFromPv: true,
      showUnits: true,
      wrapWords: true
    });
    expect(
      screen.getByText(`contents: ${responseContent}`)
    ).toBeInTheDocument();
  });
});
