import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";

import { DisplayGridLayoutComponent } from "./displayGridLayout";
import { MacroContext } from "../../../types/macros";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

vi.mock("react-grid-layout", async () => {
  const actual = await vi.importActual<any>("react-grid-layout");

  let lastProps: any = null;

  const useGridLayout = vi.fn(({ layout, cols }: any) => ({
    layout,
    cols,
    isInteracting: true,
    dragState: {
      activeDrag: { i: "a", w: 0, h: 0 },
      oldDragItem: null,
      oldLayout: null
    },
    onDragStart: vi.fn(),
    onDragStop: vi.fn(),
    onResizeStop: vi.fn()
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
      },
      fileCache: {
        fileCache: {}
      }
    })
}));

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(props =>
    createMockStyle({
      newProps: props
    })
  )
}));

const mocks = vi.hoisted(() => ({
  calculateDefaultLayout: vi.fn(),
  displayInstanceUpdateGridLayout: vi.fn(),
  displayInstanceMoveWidgetBetweenGridLayouts: vi.fn()
}));

vi.mock("./displayLayoutUtilities", () => ({
  calculateDefaultLayout: mocks.calculateDefaultLayout,
  toNumber: (v: any, fallback: number) => Number(v ?? fallback)
}));

vi.mock("../../../redux/slices/fileCacheSlice", async () => {
  const actual = await vi.importActual("../../../redux/slices/fileCacheSlice");
  return {
    ...actual,
    makeSelectWidgetPosition: () => {
      return (_state: any, _fileId: string, _id: string) => ({
        width: 1200
      });
    },
    displayInstanceSetGridLayout: vi.fn(),
    displayInstanceUpdateGridLayout: mocks.displayInstanceUpdateGridLayout,
    displayInstanceMoveWidgetBetweenGridLayouts:
      mocks.displayInstanceMoveWidgetBetweenGridLayouts
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

const TestChild = ({
  id,
  onClick
}: {
  id: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) => (
  <div data-testid={`child-${id}`} onClick={onClick}>
    child {id}
  </div>
);

const renderGrid = (props: any = {}, clickHandler?: any) =>
  render(
    <MacroContext.Provider value={{ macros: {}, updateMacro: vi.fn() }}>
      <DisplayGridLayoutComponent id="grid-test" {...props}>
        <TestChild id="a" onClick={clickHandler} />
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
    const { getByTestId } = renderGrid({
      gridLayout: [{ i: "a", w: 8, h: 4 }]
    });

    expect(mocks.calculateDefaultLayout).not.toHaveBeenCalled();
    expect(getByTestId("grid")).toBeInTheDocument();
    expect(getByTestId("child-a")).toBeInTheDocument();
    expect(getByTestId("child-b")).toBeInTheDocument();
  });

  it("sets cursor to grab when gridCellDragEnabled=true (default)", () => {
    const { getByTestId } = renderGrid({
      gridLayout: [{ i: "a", w: 8, h: 4 }]
    });

    const wrapper = getByTestId("child-a").parentElement;
    expect(wrapper?.style.cursor).toBe("grab");
  });

  it("sets cursor to default when gridCellDragEnabled=false", () => {
    const { getByTestId } = renderGrid({
      gridCellDragEnabled: false,
      gridLayout: [{ i: "a", w: 8, h: 4 }]
    });

    const wrapper = getByTestId("child-a").parentElement;
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
      17,
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

  it("renders an empty grid when gridLayout is empty", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    const { getByTestId } = renderGrid({ gridLayout: [] });

    expect(getByTestId("grid")).toBeInTheDocument();

    const props = rgl.__getLastGridProps();

    expect(props.layout).toEqual([]);
    expect(props.gridConfig).toEqual({
      cols: 17,
      margin: [6, 6],
      rowHeight: 15
    });
  });

  it("passes overridden gridConfig values to ReactGridLayout", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    renderGrid({
      gridLayout: [],
      gridLayoutColumns: 20,
      gridCellMargins: [10, 12],
      gridCellHeight: 25
    });

    const props = rgl.__getLastGridProps();

    expect(props.gridConfig).toEqual({
      cols: 20,
      margin: [10, 12],
      rowHeight: 25
    });
  });

  it("does not click through to child when dragging", async () => {
    const rgl = (await import("react-grid-layout")) as any;
    const childClickHandler = vi.fn();
    const { getByTestId } = renderGrid(
      { gridLayout: [{ i: "a", w: 8, h: 4 }] },
      childClickHandler
    );

    const wrapper = getByTestId("child-a").parentElement;
    expect(wrapper).toBeInTheDocument();

    const gridProps = rgl.__getLastGridProps();
    gridProps.onDragStart([], { i: "a" }, { i: "a" }, null, null, wrapper);

    const overlay = getByTestId("drag-overlay");
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay);
    expect(childClickHandler).not.toHaveBeenCalled();
  });
  it("renders delete buttons when editable", () => {
    const { getByLabelText } = renderGrid({
      editable: true,
      gridLayout: [
        { i: "a", w: 8, h: 4 },
        { i: "b", w: 8, h: 4 }
      ]
    });

    expect(getByLabelText("Delete widget a")).toBeInTheDocument();

    expect(getByLabelText("Delete widget b")).toBeInTheDocument();
  });

  it("does not render delete buttons when not editable", () => {
    const { queryByLabelText } = renderGrid({
      editable: false,
      gridLayout: [{ i: "a", w: 8, h: 4 }]
    });

    expect(queryByLabelText("Delete widget a")).not.toBeInTheDocument();
  });
  it("deletes a widget when the delete button is clicked", () => {
    const { getByLabelText } = renderGrid({
      editable: true,
      embeddedDisplayUuid: "display-1",
      gridLayout: [
        { i: "a", x: 0, y: 0, w: 8, h: 4 },
        { i: "b", x: 8, y: 0, w: 8, h: 4 }
      ]
    });

    const deleteButton = getByLabelText("Delete widget a");

    fireEvent.click(deleteButton);

    expect(mocks.displayInstanceUpdateGridLayout).toHaveBeenCalledWith({
      embeddedDisplayUuid: "display-1",
      gridDisplayId: "grid-test",
      gridLayout: [{ i: "b", x: 8, y: 0, w: 8, h: 4 }],
      update: {
        type: "delete",
        widgetId: "a"
      }
    });
  });

  it("renders cross-grid drag handle when editable is false", async () => {
    const { getByLabelText } = renderGrid({
      editable: false,
      gridLayout: [{ i: "a", x: 0, y: 0, w: 2, h: 3 }]
    });

    const handle = getByLabelText("Drag widget a to Quick Screen");

    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("draggable", "true");
    expect(handle).toHaveClass("drag-handle");
  });

  it("does not enable cross-grid drag handle when editable is true", () => {
    const { getByTestId, queryByLabelText } = renderGrid({
      editable: true,
      gridLayout: [{ i: "a", x: 0, y: 0, w: 2, h: 3 }]
    });

    expect(
      queryByLabelText("Drag widget a to Quick Screen")
    ).not.toBeInTheDocument();
  });

  it("enables cross-grid drops when editable", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    renderGrid({
      editable: true,
      gridLayout: []
    });

    expect(rgl.__getLastGridProps().dropConfig.enabled).toBe(true);
  });

  it("disables cross-grid drops when not editable", async () => {
    const rgl = (await import("react-grid-layout")) as any;

    renderGrid({
      editable: false,
      gridLayout: []
    });

    expect(rgl.__getLastGridProps().dropConfig.enabled).toBe(false);
  });
  it("starts a cross-grid drag from the drag handle", () => {
    const { getByLabelText } = renderGrid({
      editable: false,
      embeddedDisplayUuid: "display-1",
      gridLayout: [{ i: "a", x: 2, y: 3, w: 4, h: 5 }]
    });

    const handle = getByLabelText("Drag widget a to Quick Screen");

    const dataTransfer = {
      effectAllowed: "",
      setData: vi.fn()
    };

    fireEvent.dragStart(handle, { dataTransfer });

    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "text/plain",
      expect.any(String)
    );

    const dragData = JSON.parse(dataTransfer.setData.mock.calls[0][1]);

    expect(dragData).toEqual(
      expect.objectContaining({
        widgetId: "a",
        sourceGridId: "grid-test",
        sourceEmbeddedDisplayUuid: "display-1",
        w: 4,
        h: 5
      })
    );
  });
});
