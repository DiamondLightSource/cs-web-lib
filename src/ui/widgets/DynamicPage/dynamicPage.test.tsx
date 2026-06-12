import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { DynamicPageComponent } from "./dynamicPage";
import { FileContext } from "../../../misc/fileContext";

import { useSelector } from "react-redux";
import { Theme } from "react-toastify";

vi.mock("../../hooks/useStyle", () => ({
  useStyle: () => ({
    border: {},
    colors: {},
    font: {},
    other: {}
  })
}));

const mockEmbeddedDisplay = vi.fn((props?: any) => (
  <div data-testid="embedded-display" />
));

vi.mock("../EmbeddedDisplay/embeddedDisplay", () => ({
  EmbeddedDisplay: (props: any) => {
    mockEmbeddedDisplay(props);
    return <div data-testid="embedded-display" />;
  }
}));

const mockActionButton = vi.fn((props?: any) => (
  <div data-testid="action-button" />
));

vi.mock("../ActionButton/actionButton", () => ({
  ActionButton: (props: any) => {
    mockActionButton(props);
    return <div data-testid="action-button" />;
  }
}));

vi.mock("react-redux", () => ({
  useSelector: vi.fn()
}));

const renderWithContext = (ui: React.ReactNode, pageState: any = {}) => {
  return render(
    <FileContext.Provider
      value={
        {
          pageState,
          removePage: vi.fn()
        } as any
      }
    >
      {ui}
    </FileContext.Provider>
  );
};

const mockedUseSelector = useSelector as unknown as Mock;

const baseProps = {
  location: "test-location",
  position: { x: "0", y: "0", width: "100%", height: "100%" }
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DynamicPageComponent (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSelector.mockReset();
  });

  it("renders message when no file is loaded", () => {
    const { getByText } = renderWithContext(
      <DynamicPageComponent {...baseProps} />,
      {}
    );

    expect(
      getByText(/Dynamic page "test-location": no file loaded/i)
    ).toBeInTheDocument();
  });

  it("renders EmbeddedDisplay when file exists", () => {
    const file = { path: "file1", macros: {} };

    renderWithContext(<DynamicPageComponent {...baseProps} />, {
      "test-location": file
    });

    expect(mockEmbeddedDisplay).toHaveBeenCalled();
  });

  it("renders close button by default", () => {
    const file = { path: "file1", macros: {} };

    const { getByTestId } = renderWithContext(
      <DynamicPageComponent {...baseProps} />,
      { "test-location": file }
    );

    expect(getByTestId("action-button")).toBeInTheDocument();
  });

  it("does not render close button when showCloseButton is false", () => {
    const file = { path: "file1", macros: {} };

    const { queryByTestId } = renderWithContext(
      <DynamicPageComponent {...baseProps} showCloseButton={false} />,
      { "test-location": file }
    );

    expect(queryByTestId("action-button")).toBeNull();
  });

  it("passes correct props to EmbeddedDisplay (default branch)", () => {
    const file = { path: "file1", macros: {} };

    renderWithContext(<DynamicPageComponent {...baseProps} scroll={true} />, {
      "test-location": file
    });

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.file).toBe(file);
    expect(props.scroll).toBe(true);
    expect(props.scalingOrigin).toBe("0 0");
  });

  it("passes full-size position when showCloseButton is false", () => {
    const file = { path: "file1", macros: {} };

    renderWithContext(
      <DynamicPageComponent {...baseProps} showCloseButton={false} />,
      { "test-location": file }
    );

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.position.width).toBe("100%");
    expect(props.position.height).toBe("100%");
  });

  it("defaults scroll to false", () => {
    const file = { path: "file1", macros: {} };

    renderWithContext(<DynamicPageComponent {...baseProps} />, {
      "test-location": file
    });

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.scroll).toBe(false);
  });

  it("passes mjpgEndpoints combining custom and default", () => {
    const file = { path: "file1", macros: {} };

    mockedUseSelector.mockReturnValue("default-endpoint");

    renderWithContext(
      <DynamicPageComponent {...baseProps} mjpgEndpoint="custom-endpoint" />,
      { "test-location": file }
    );

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.mjpgEndpoints).toEqual([
      "custom-endpoint",
      "default-endpoint"
    ]);
  });

  it("filters out undefined mjpgEndpoints", () => {
    const file = { path: "file1", macros: {} };

    mockedUseSelector.mockReturnValue("default-endpoint");
    mockedUseSelector.mockReturnValue(undefined);

    renderWithContext(<DynamicPageComponent {...baseProps} />, {
      "test-location": file
    });

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.mjpgEndpoints).toEqual([]);
  });

  it("passes widgetIdsCallback to EmbeddedDisplay", () => {
    const file = { path: "file1", macros: {} };
    const callback = vi.fn();

    renderWithContext(
      <DynamicPageComponent {...baseProps} widgetIdsCallback={callback} />,
      { "test-location": file }
    );

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.widgetIdsCallback).toBe(callback);
  });

  it("passes custom theme to EmbeddedDisplay", () => {
    const file = { path: "file1", macros: {} };
    const customTheme = {};

    renderWithContext(
      <DynamicPageComponent {...baseProps} theme={customTheme} />,
      { "test-location": file }
    );

    const props = mockEmbeddedDisplay.mock.calls[0][0];

    expect(props.theme).toBe(customTheme);
  });

  it("wires ActionButton with correct CLOSE_PAGE payload", () => {
    const file = { path: "file1", macros: {} };

    renderWithContext(<DynamicPageComponent {...baseProps} />, {
      "test-location": file
    });

    const actionProps = mockActionButton.mock.calls[0][0];
    const action = actionProps.actions.actions[0];

    expect(action.dynamicInfo.name).toBe("test-location");
    expect(action.dynamicInfo.location).toBe("test-location");
    expect(action.dynamicInfo.file).toBe(file);
    expect(action.dynamicInfo.description).toBe("Close");
  });
});
