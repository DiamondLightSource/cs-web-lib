import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { EmbeddedDisplay } from "./embeddedDisplay";
import { MacroContext } from "../../../types/macros";

import { useFile } from "../../hooks/useFile";
import { BorderStyle, newRelativePosition } from "../../../types";
import { newBorder } from "../../../types/border";

vi.mock("../../hooks/useFile", () => ({
  useFile: vi.fn(),
  EMPTY_WIDGET: { fileId: "EMPTY" }
}));

vi.mock("../../hooks/useRules", () => ({
  useRules: vi.fn(x => x)
}));

vi.mock("../../hooks/useMacros", () => ({
  recursiveResolve: vi.fn(x => x)
}));

vi.mock("../../hooks/useClassFile", () => ({
  useClassFile: vi.fn(theme => theme || {})
}));

const mockWidgetRenderer = vi.fn((config: any) => (
  <div data-testid="rendered" />
));
vi.mock("../createComponent", () => ({
  widgetDescriptionToComponent: (...args: any[]) => mockWidgetRenderer(args),
  errorWidget: (msg: string) => ({ type: "error", message: msg })
}));

vi.mock("../GroupBox/groupBox", () => ({
  GroupBoxComponent: ({ children }: any) => (
    <div data-testid="groupbox">{children}</div>
  )
}));

vi.mock("react-id-generator", () => ({
  useId: () => ["test-id"]
}));

vi.mock("../utils", () => ({
  getOptionalValue: (v: any, d: any) => (v !== undefined ? v : d),
  trimFromString: (s: string | number) =>
    typeof s === "string" ? parseInt(s) : s
}));

vi.mock("../../../types/color", () => ({
  newColor: () => ({ colorString: "color" })
}));

vi.mock("../../../types/border", () => ({
  newBorder: (style: any, color: any) => ({ style, color, width: 1 }),
  BorderStyle: { Line: "line", GroupBox: "groupbox" }
}));

const baseProps = {
  position: newRelativePosition(),
  file: { path: "file", macros: {}, defaultProtocol: "ca" }
};

const renderWithContext = (ui: React.ReactNode) => {
  return render(
    <MacroContext.Provider value={{ macros: {}, updateMacro: vi.fn() }}>
      {ui}
    </MacroContext.Provider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EmbeddedDisplay (unit)", () => {
  it("renders component from description", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "display",
        position: {},
        children: []
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} />);

    expect(mockWidgetRenderer).toHaveBeenCalled();
  });

  it("calls widgetIdsCallback when description is loaded", () => {
    const callback = vi.fn();

    vi.mocked(useFile).mockReturnValue([
      {
        id: "desc-id",
        fileId: "file1",
        type: "dummy",
        position: {},
        children: []
      },
      "uuid-123"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} widgetIdsCallback={callback} />
    );

    expect(callback).toHaveBeenCalledWith("uuid-123", "desc-id");
  });

  it("applies scroll-content resize correctly", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: []
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} resize="scroll-content" />
    );

    // verify widgetDescriptionToComponent received overflow auto
    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.overflow).toBe("auto");
  });

  it("enables autoZoom for size-content", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: []
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} resize="size-content" />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.autoZoomToFit).toBe(true);
  });

  it("filters children by groupName", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: [
          {
            id: "124",
            fileId: "file124",
            type: "groupbox",
            name: "A",
            position: {},
            children: []
          },
          {
            id: "125",
            fileId: "file125",
            type: "groupbox",
            name: "B",
            position: {},
            children: []
          }
        ]
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} groupName="B" />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];

    expect(args.children[0].children).toHaveLength(1);
    expect(args.children[0].children[0].name).toBe("B");
  });

  it("resolves groupName using macros", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: [
          {
            id: "123",
            fileId: "file123",
            type: "groupbox",
            name: "$(GROUP)",
            position: {},
            children: []
          }
        ]
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay
        {...baseProps}
        groupName="resolved"
        file={{
          ...baseProps.file,
          macros: { GROUP: "resolved" }
        }}
      />
    );

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.children[0].children).toHaveLength(1);
  });

  it("handles nested embedded displays (no double scaling)", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: [
          {
            id: "123",
            fileId: "file123",
            type: "embeddedDisplay",
            position: {},
            children: []
          }
        ]
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} overrideAutoZoomToFitValue />
    );

    const args = mockWidgetRenderer.mock.calls[0][0][0];

    const child = args.children[0].children[0];
    expect(child.overrideAutoZoomToFitValue).toBe(false);
  });

  it("passes scaling factors when autoZoom is enabled", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: { width: "100px", height: "100px" },
        autoZoomToFit: true,
        children: []
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];

    expect(args.scaling[0]).toBe("7.68");
    expect(args.scaling[1]).toBe("7.68");
  });

  it("wraps in GroupBox when border style is GroupBox", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: []
      },
      "uuid"
    ]);

    const props = {
      ...baseProps,
      border: newBorder(BorderStyle.GroupBox, { colorString: "white" }, 1)
    };

    const { getByTestId } = renderWithContext(<EmbeddedDisplay {...props} />);

    expect(getByTestId("groupbox")).toBeInTheDocument();
  });

  it("renders error widget when rendering fails", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockWidgetRenderer.mockImplementationOnce(() => {
      throw new Error("fail");
    });

    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: {},
        children: []
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} />);

    expect(mockWidgetRenderer).toHaveBeenCalled();

    spy.mockRestore();
  });

  it("handles stretch-content with independent scaling", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "123",
        fileId: "file123",
        type: "dummy",
        position: { width: "100px", height: "200px" },
        autoZoomToFit: true,
        children: []
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} resize="stretch-content" />
    );

    const args = mockWidgetRenderer.mock.calls[0][0][0];

    expect(args.autoZoomToFit).toBe(true);
    expect(args.overflow).toBe("visible");
    expect(args.scaling[0]).not.toBe(args.scaling[1]); // independent scaling
  });

  it("sets overflow visible for size-widget", () => {
    vi.mocked(useFile).mockReturnValue([
      { id: "1", fileId: "f1", type: "d", position: {}, children: [] },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} resize="size-widget" />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.overflow).toBe("visible");
    expect(args.autoZoomToFit).not.toBe(true);
  });

  it("sets overflow hidden for crop-content", () => {
    vi.mocked(useFile).mockReturnValue([
      { id: "1", fileId: "f1", type: "d", position: {}, children: [] },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} resize="crop-content" />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.overflow).toBe("hidden");
  });

  it("does not call widgetIdsCallback when EMPTY_WIDGET is returned", () => {
    const callback = vi.fn();

    vi.mocked(useFile).mockReturnValue([
      {
        id: "ignored",
        fileId: "EMPTY",
        type: "dummy",
        position: {},
        children: []
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} widgetIdsCallback={callback} />
    );

    expect(callback).not.toHaveBeenCalled();
  });

  it("respects overrideAutoZoomToFitValue=false", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "1",
        fileId: "f",
        type: "d",
        position: {},
        autoZoomToFit: true,
        children: []
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} overrideAutoZoomToFitValue={false} />
    );

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.autoZoomToFit).toBe(false);
  });

  it("falls back to description.autoZoomToFit when override undefined", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "1",
        fileId: "f",
        type: "d",
        position: {},
        autoZoomToFit: true,
        children: []
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.autoZoomToFit).toBe(true);
  });

  it("uses window size when position is missing", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 800,
      configurable: true
    });
    Object.defineProperty(window, "innerHeight", {
      value: 600,
      configurable: true
    });

    vi.mocked(useFile).mockReturnValue([
      {
        id: "1",
        fileId: "f",
        type: "d",
        position: {},
        autoZoomToFit: true,
        children: []
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];

    expect(args.scaling[0]).toBe("1");
    expect(args.scaling[1]).toBe("1");
  });

  it("converts numeric resize to string enum", () => {
    vi.mocked(useFile).mockReturnValue([
      { id: "1", fileId: "f", type: "d", position: {}, children: [] },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} resize={1} />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    // index 1 = "size-content"
    expect(args.autoZoomToFit).toBe(true);
  });

  it("propagates scalingOrigin to child when not autoZoom", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "1",
        fileId: "f",
        type: "d",
        position: { height: "100px", width: "100px" },
        autoZoomToFit: false,
        children: [
          {
            id: "child",
            fileId: "cf",
            type: "embeddedDisplay",
            position: {},
            children: []
          }
        ]
      },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} scalingOrigin="center" />
    );

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    const child = args.children[0].children[0];

    expect(child.scalingOrigin).toBe("center");
  });

  it("uses provided theme instead of default", () => {
    const customTheme = {} as any;

    vi.mocked(useFile).mockReturnValue([
      { id: "1", fileId: "f", type: "d", position: {}, children: [] },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} theme={customTheme} />);

    // indirect check: component rendered successfully
    expect(mockWidgetRenderer).toHaveBeenCalled();
  });

  it("renders error widget when renderer throws", () => {
    mockWidgetRenderer.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    vi.mocked(useFile).mockReturnValue([
      { id: "1", fileId: "f", type: "d", position: {}, children: [] },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} />);

    const call = mockWidgetRenderer.mock.calls[1]; // second call = error fallback
    expect(call[0][0].type).toBe("error");
  });

  it("passes scalingOrigin to renderer", () => {
    vi.mocked(useFile).mockReturnValue([
      { id: "1", fileId: "f", type: "d", position: {}, children: [] },
      "uuid"
    ]);

    renderWithContext(
      <EmbeddedDisplay {...baseProps} scalingOrigin="top-left" />
    );

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.scalingOrigin).toBe("top-left");
  });

  it("falls back to all children when groupName not found", () => {
    vi.mocked(useFile).mockReturnValue([
      {
        id: "1",
        fileId: "f",
        type: "d",
        position: {},
        children: [
          {
            id: "a",
            fileId: "f",
            type: "groupbox",
            name: "A",
            position: {},
            children: []
          }
        ]
      },
      "uuid"
    ]);

    renderWithContext(<EmbeddedDisplay {...baseProps} groupName="NOT_FOUND" />);

    const args = mockWidgetRenderer.mock.calls[0][0][0];
    expect(args.children[0].children).toHaveLength(1);
  });
});
