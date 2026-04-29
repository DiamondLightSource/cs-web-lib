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

    ReactGridLayout: (props: any) => {
      lastProps = props;
      return <div data-testid="grid">{props.children}</div>;
    },

    useContainerWidth: () => ({
      width: 800,
      mounted: true,
      containerRef: { current: null }
    }),

    useGridLayout,

    verticalCompactor: vi.fn(),

    __getLastGridProps: () => lastProps
  };
});

vi.mock("../../hooks/useStyle", () => ({
  useStyle: () => ({
    colors: {},
    font: {},
    border: {},
    other: {}
  })
}));

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
  it("renders the grid and children", () => {
    renderGrid();

    expect(screen.getByTestId("grid")).toBeInTheDocument();
    expect(screen.getByTestId("child-a")).toBeInTheDocument();
    expect(screen.getByTestId("child-b")).toBeInTheDocument();
  });

  it("sets cursor to grab when gridCellDragEnabled=true (default)", () => {
    renderGrid();

    const wrapper = screen.getByTestId("child-a").parentElement;
    expect(wrapper?.style.cursor).toBe("grab");
  });

  it("sets cursor to default when gridCellDragEnabled=false", () => {
    renderGrid({ gridCellDragEnabled: false });

    const wrapper = screen.getByTestId("child-a").parentElement;
    expect(wrapper?.style.cursor).toBe("default");
  });

  it("passes correct config into useGridLayout", async () => {
    const { useGridLayout } = await import("react-grid-layout");
    const spy = vi.spyOn({ useGridLayout }, "useGridLayout");

    renderGrid({ gridLayoutColumns: 16 });

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

  it("generates default layout when gridLayout is not provided", async () => {
    const { useGridLayout } = await import("react-grid-layout");

    renderGrid();

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
    renderGrid();

    const gridProps = rgl.__getLastGridProps();
    const el = document.createElement("div");

    gridProps.onDragStart([], null, null, null, null, el);
    expect(el.style.cursor).toBe("grabbing");

    gridProps.onDragStop([], null, null, null, null, el);
    expect(el.style.cursor).toBe("grab");
  });

  it("does not change cursor during drag lifecycle when drag disabled", async () => {
    const rgl = (await import("react-grid-layout")) as any;
    renderGrid({ gridCellDragEnabled: false });

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

    renderGrid({ gridCellResizeEnabled: false });

    expect(rgl.__getLastGridProps().resizeConfig.enabled).toBe(false);

    renderGrid({ gridCellResizeEnabled: true });

    expect(rgl.__getLastGridProps().resizeConfig.enabled).toBe(true);
  });

  it("uses default and overridden gridConfig values", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    // defaults
    renderGrid();
    let config = rgl.__getLastGridProps().gridConfig;

    expect(config.cols).toBe(32);
    expect(config.margin).toEqual([6, 6]);
    expect(config.rowHeight).toBe(15);

    // overrides
    renderGrid({
      gridLayoutColumns: 20,
      gridCellMargins: [10, 12],
      gridCellHeight: 25
    });

    config = rgl.__getLastGridProps().gridConfig;

    expect(config.cols).toBe(20);
    expect(config.margin).toEqual([10, 12]);
    expect(config.rowHeight).toBe(25);
  });
});
