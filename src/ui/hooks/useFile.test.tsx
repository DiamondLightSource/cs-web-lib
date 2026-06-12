import React from "react";
import { contextRender, createRootStoreState } from "../../testResources";
import { File, useFile } from "./useFile";
import { Mock, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { ensureWidgetsRegistered } from "../widgets";
import { newAbsolutePosition, PositionType } from "../../types/position";
import { ColorUtils } from "../../types/color";
import {
  createDisplayInstanceFromFile,
  fileChanged
} from "../../redux/slices/fileCacheSlice";
import { httpRequest } from "../../misc";
import { useSelector } from "react-redux";

ensureWidgetsRegistered();

vi.mock("../../misc", () => ({
  httpRequest: vi.fn()
}));
const mockedHttpRequest = httpRequest as unknown as Mock;
const mockedUseSelector = useSelector as unknown as Mock;
const mockDispatch = vi.fn();

vi.mock("react-redux", async () => {
  const actual = await vi.importActual<any>("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
    useSelector: vi.fn()
  };
});

const parsedWidget = {
  id: "1234",
  type: "ellipse",
  fileId: "test.json",
  children: [],
  position: { positionType: PositionType.RELATIVE }
};

const FileTester = (props: { file: File }): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contents, _] = useFile(props.file);
  return <div>contents: {JSON.stringify(contents)}</div>;
};

describe("useFile", (): void => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty widget if file not in cache", () => {
    const { getByText } = contextRender(
      <FileTester
        file={{ path: "test.bob", defaultProtocol: "ca", macros: {} }}
      />,
      {},
      {},
      createRootStoreState()
    );

    const responseContent = JSON.stringify({
      type: "shape",
      id: "EMPTY_WIDGET",
      fileId: "EMPTY_WIDGET",
      position: newAbsolutePosition("0", "0", "0", "0")
    });

    expect(getByText(`contents: ${responseContent}`)).toBeInTheDocument();
  });

  it("returns widget if instance is in cache", async () => {
    mockedUseSelector
      .mockReturnValueOnce({
        description: parsedWidget,
        uuid: "uuid-1"
      })
      .mockReturnValueOnce(parsedWidget);

    const { getByText } = contextRender(
      <FileTester
        file={{ path: "test.bob", defaultProtocol: "ca", macros: {} }}
      />,
      {},
      {},
      createRootStoreState()
    );

    await waitFor(() => {
      const text = getByText(/contents:/).textContent || "";

      expect(text).toContain('"id":"1234"');
      expect(text).toContain('"fileId":"test.json"');
    });
  });

  it("does not fetch file if file in cache, dispatches to create new display instance and updates UI after instance is available", async () => {
    const file = {
      path: "test.json",
      defaultProtocol: "ca",
      macros: {}
    };

    mockedUseSelector
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(parsedWidget);

    const { getByText, rerender } = contextRender(
      <FileTester file={file} />,
      {},
      {},
      createRootStoreState()
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    expect(mockedHttpRequest).toHaveBeenCalledTimes(0);

    expect(mockDispatch).not.toHaveBeenCalledWith(
      fileChanged({
        file: "test.json",
        contents: expect.objectContaining({
          id: "1234"
        })
      })
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      createDisplayInstanceFromFile({
        file: "test.json",
        macros: {}
      })
    );

    mockedUseSelector
      .mockReturnValueOnce({
        description: parsedWidget,
        uuid: "uuid-1"
      })
      .mockReturnValueOnce(parsedWidget);

    // Re-render
    rerender(<FileTester file={file} />);

    await waitFor(() => {
      const text = getByText(/contents:/).textContent || "";

      expect(text).toContain('"id":"1234"');
      expect(text).toContain('"fileId":"test.json"');
    });
  });

  it("fetches file if not in cache, dispatches file contents and updates UI after data is available", async () => {
    const file = {
      path: "test.json",
      defaultProtocol: "ca",
      macros: {}
    };

    const mockResponse = JSON.stringify({
      id: "1234",
      type: "ellipse",
      backgroundColor: ColorUtils.GREEN
    });

    mockedHttpRequest.mockResolvedValue({
      text: () => Promise.resolve(mockResponse)
    });

    mockedUseSelector.mockReturnValueOnce(null).mockReturnValueOnce(null);

    const { getByText, rerender } = contextRender(
      <FileTester file={file} />,
      {},
      {},
      createRootStoreState()
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    expect(mockedHttpRequest).toHaveBeenCalledTimes(1);
    expect(mockedHttpRequest).toHaveBeenCalledWith("test.json");

    expect(mockDispatch).toHaveBeenCalledWith(
      fileChanged({
        file: "test.json",
        contents: expect.objectContaining({
          id: "1234"
        })
      })
    );

    expect(mockDispatch).toHaveBeenCalledWith(
      createDisplayInstanceFromFile({
        file: "test.json",
        macros: {}
      })
    );

    mockedUseSelector
      .mockReturnValueOnce({
        description: parsedWidget,
        uuid: "uuid-1"
      })
      .mockReturnValueOnce(parsedWidget);

    // Re-render
    rerender(<FileTester file={file} />);

    await waitFor(() => {
      const text = getByText(/contents:/).textContent || "";

      expect(text).toContain('"id":"1234"');
      expect(text).toContain('"fileId":"test.json"');
    });
  });
});
