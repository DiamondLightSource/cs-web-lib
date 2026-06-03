import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { DisplayGridLayoutComponent } from "./displayGridLayout";
import { MacroContext } from "../../../types/macros";

vi.mock("react-grid-layout", async () => {
  const actual = await vi.importActual<any>("react-grid-layout");

  let lastProps: any = null;

  const useGridLayout = vi.fn(({ layout, cols }: any) => ({
    layout,
    cols
  }));

  return {
    ...actual,
    useGridLayout,
    ReactGridLayout: (props: any) => {
      lastProps = props;
      return <div data-testid="grid">{props.children}</div>;
    },

    useContainerWidth: () => ({
      width: 800,
      mounted: true,
      containerRef: { current: null }
    }),

    verticalCompactor: vi.fn(),

    __getLastGridProps: () => lastProps,

    __resetGridProps: () => {
      lastProps = null;
    }
  };
});

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (selector: any) =>
    selector({
      csState: {
        files: {}
      }
    })
}));

vi.mock("../../hooks/useStyle", () => ({
  useStyle: () => ({
    colors: {},
    font: {},
    border: {},
    other: {}
  })
}));

const mocks = vi.hoisted(() => ({
  calculateDefaultLayout: vi.fn()
}));

vi.mock("./displayLayoutUtilities", () => ({
  calculateDefaultLayout: mocks.calculateDefaultLayout,
  toNumber: (v: any, fallback: number) => Number(v ?? fallback)
}));

vi.mock("../../../redux/csState", async () => {
  const actual = await vi.importActual("../../../redux/csState");
  return {
    ...actual,
    makeSelectWidgetPosition: () => {
      return (_state: any, _fileId: string, _id: string) => ({
        width: 1200
      });
    },
    fileDisplaySetRGLayout: vi.fn()
  };
});

vi.mock("../../hooks/useDebounce", () => ({
  useDebouncedValue: (v: any) => v
}));

vi.mock("../widget", () => ({
  Widget: ({ baseWidget: Comp, ...props }: any) => <Comp {...props} />
}));

vi.mock("../register", () => ({
  registerWidget: vi.fn()
}));

const TestChild = ({ id }: { id: string }) => (
  <div data-testid={`child-${id}`}>child {id}</div>
);

const renderGrid = (props: any = {}) =>
  render(
    <MacroContext.Provider value={{ macros: {}, updateMacro: vi.fn() }}>
      <DisplayGridLayoutComponent id="grid-test" {...props}>
        <TestChild id="a" />
        <TestChild id="b" />
      </DisplayGridLayoutComponent>
    </MacroContext.Provider>
  );

describe("DisplayGridLayoutComponent", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const rgl = (await import("react-grid-layout")) as any;
    rgl.__resetGridProps();
  });

  it("renders the grid and children", () => {
    renderGrid({ gridLayout: [{ i: "a", w: 8, h: 4 }] });

    expect(mocks.calculateDefaultLayout).not.toHaveBeenCalled();
    expect(screen.getByTestId("grid")).toBeInTheDocument();
    expect(screen.getByTestId("child-a")).toBeInTheDocument();
    expect(screen.getByTestId("child-b")).toBeInTheDocument();
  });

  it("sets cursor to grab when gridCellDragEnabled=true (default)", () => {
    renderGrid({ gridLayout: [{ i: "a", w: 8, h: 4 }] });

    const wrapper = screen.getByTestId("child-a").parentElement;
    expect(wrapper?.style.cursor).toBe("grab");
  });

  it("sets cursor to default when gridCellDragEnabled=false", () => {
    renderGrid({
      gridCellDragEnabled: false,
      gridLayout: [{ i: "a", w: 8, h: 4 }]
    });

    const wrapper = screen.getByTestId("child-a").parentElement;
    expect(wrapper?.style.cursor).toBe("default");
  });

  it("passes correct cols into useGridLayout", async () => {
    const { useGridLayout } = await import("react-grid-layout");
    const spy = vi.spyOn({ useGridLayout }, "useGridLayout");

    renderGrid({
      gridLayoutColumns: 16,
      gridLayout: [
        { i: "a", w: 8, h: 4 },
        { i: "b", w: 8, h: 4 }
      ]
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        cols: 16,
        layout: expect.arrayContaining([
          expect.objectContaining({ i: "a" }),
          expect.objectContaining({ i: "b" })
        ])
      })
    );
  });

  it("generates layout when gridLayout is provided", async () => {
    const { useGridLayout } = await import("react-grid-layout");

    renderGrid({
      gridLayout: [
        { i: "a", w: 8, h: 4 },
        { i: "b", w: 8, h: 4 }
      ]
    });

    expect(useGridLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.arrayContaining([
          expect.objectContaining({ i: "a", w: 8, h: 4 }),
          expect.objectContaining({ i: "b", w: 8, h: 4 })
        ])
      })
    );
  });

  it("updates cursor during drag lifecycle when enabled", async () => {
    const rgl = (await import("react-grid-layout")) as any;
    renderGrid({
      gridLayout: [{ i: "widget-1", x: 0, y: 0, w: 2, h: 2 }]
    });

    const gridProps = rgl.__getLastGridProps();
    const el = document.createElement("div");

    gridProps.onDragStart([], null, null, null, null, el);
    expect(el.style.cursor).toBe("grabbing");

    gridProps.onDragStop([], null, null, null, null, el);
    expect(el.style.cursor).toBe("grab");
  });

  it("does not change cursor during drag lifecycle when drag disabled", async () => {
    const rgl = (await import("react-grid-layout")) as any;
    renderGrid({
      gridCellDragEnabled: false,
      gridLayout: [{ i: "widget-1", x: 0, y: 0, w: 2, h: 2 }]
    });

    const gridProps = rgl.__getLastGridProps();
    const el = document.createElement("div");

    gridProps.onDragStart([], null, null, null, null, el);
    expect(el.style.cursor).toBe("");

    gridProps.onDragStop([], null, null, null, null, el);
    expect(el.style.cursor).toBe("");
  });

  it("does not render the grid when container is not mounted", async () => {
    const rgl = await import("react-grid-layout");

    vi.spyOn(rgl, "useContainerWidth").mockReturnValueOnce({
      width: 800,
      mounted: false,
      containerRef: { current: null },
      measureWidth: vi.fn()
    });

    renderGrid();

    expect(screen.queryByTestId("grid")).not.toBeInTheDocument();
  });

  it("toggles resizeConfig.enabled based on gridCellResizeEnabled", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    renderGrid({
      gridCellResizeEnabled: false,
      gridLayout: [{ i: "widget-1", x: 0, y: 0, w: 2, h: 2 }]
    });

    expect(rgl.__getLastGridProps().resizeConfig.enabled).toBe(false);

    renderGrid({
      gridCellResizeEnabled: true,
      gridLayout: [{ i: "widget-1", x: 0, y: 0, w: 2, h: 2 }]
    });

    expect(rgl.__getLastGridProps().resizeConfig.enabled).toBe(true);
  });

  it("Calls calculateDefaultLayout with default values, when layout is undefined", async () => {
    renderGrid();

    expect(mocks.calculateDefaultLayout).toHaveBeenCalledWith(
      expect.any(Array),
      1200,
      32,
      [6, 6],
      15
    );
  });

  it("Calls calculateDefaultLayout with props values, when layout is undefined", async () => {
    renderGrid({
      gridCellDragEnabled: false,
      gridCellResizeEnabled: false,
      gridCellHeight: 30,
      gridCellMargins: [3, 3],
      gridLayoutColumns: 50
    });

    expect(mocks.calculateDefaultLayout).toHaveBeenCalledWith(
      expect.any(Array),
      1200,
      50,
      [3, 3],
      30
    );
  });

  it("Does not render if gridLayout is empty and overridden gridConfig values", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    // defaults
    renderGrid({ gridLayout: [] });
    let config = rgl.__getLastGridProps()?.gridConfig;

    expect(config).toBeUndefined();

    // overrides
    renderGrid({
      gridLayoutColumns: 20,
      gridCellMargins: [10, 12],
      gridCellHeight: 25,
      gridLayout: [{ i: "widget-1", x: 0, y: 0, w: 2, h: 2 }]
    });

    config = rgl.__getLastGridProps()?.gridConfig;

    expect(config).not.toBeUndefined();
    expect(config?.cols).toBe(20);
    expect(config?.margin).toEqual([10, 12]);
    expect(config?.rowHeight).toBe(25);
  });
});
