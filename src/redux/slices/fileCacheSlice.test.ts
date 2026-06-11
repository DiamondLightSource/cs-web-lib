import { createRootStoreState } from "../../testResources";
import { ColorUtils } from "../../types";
import { newAbsolutePosition } from "../../types/position";
import { WidgetDescription } from "../../ui/widgets/createComponent";
import fileCacheReducer, {
  FileCacheState,
  fileChanged,
  fileComparator,
  displayInstanceSetGridLayout,
  displayInstanceSetResponsiveLayout,
  makeSelectWidgetPosition,
  refreshFile,
  selectFile
} from "./fileCacheSlice";

const initialState: FileCacheState = {
  fileCache: {
    "mySecondFile.bob": {
      fileId: "mySecondFile.bob",
      id: "123",
      type: "ellipse",
      position: newAbsolutePosition("0", "0", "0", "0")
    }
  }
};

describe("fileDisplaySetResponsiveLayout", () => {
  const baseDisplay = {
    id: "display1",
    type: "displayResponsive",
    fileId: "file",
    children: [
      {
        id: "child1",
        type: "shape",
        position: newAbsolutePosition("10", "10", "20", "20")
      }
    ],
    position: newAbsolutePosition("0", "0", "100", "100")
  };

  const initialState: FileCacheState = {
    fileCache: {
      "file.bob": baseDisplay as any
    }
  };

  test("applies responsive layout and updates child positions", () => {
    const action = displayInstanceSetResponsiveLayout({
      file: "file.bob",
      displayId: "display1",
      responsiveLayouts: { lg: [] },
      responsiveColumns: { lg: 12 },
      responsiveBreakpoints: { lg: 1200 },
      gridCellMargins: [10, 10],
      gridCellHeight: 50,
      gridCellDragEnabled: true,
      gridCellResizeEnabled: false
    });

    const state = fileCacheReducer(initialState, action);
    const display = state.fileCache["file.bob"];

    expect(display.responsiveColumns.lg).toBe(12);
    expect(display.gridCellHeight).toBe(50);

    // parent width forced to 100%
    expect(display.position.width).toBe("100%");

    const child = display?.children?.[0];
    expect(child?.position).toMatchObject({
      x: "0",
      y: "0",
      width: "100%",
      height: "100%"
    });
  });

  test("does nothing if display type is wrong", () => {
    const badState = {
      ...initialState,
      fileCache: {
        "file.bob": { ...baseDisplay, type: "shape" } as any
      }
    };

    const action = displayInstanceSetResponsiveLayout({
      file: "file.bob",
      displayId: "display1",
      responsiveLayouts: {},
      responsiveColumns: {},
      responsiveBreakpoints: {},
      gridCellMargins: [0, 0],
      gridCellHeight: 10,
      gridCellDragEnabled: true,
      gridCellResizeEnabled: true
    });

    const state = fileCacheReducer(badState, action);
    expect(state).toEqual(badState);
  });
});

describe("fileDisplaySetGridLayout", () => {
  const baseDisplay = {
    id: "display1",
    type: "displayGridLayout",
    fileId: "file",
    children: [
      {
        id: "child1",
        type: "shape",
        position: newAbsolutePosition("10", "10", "20", "20")
      }
    ],
    position: newAbsolutePosition("0", "0", "100", "100")
  };

  const initialState: FileCacheState = {
    fileCache: {
      "file.bob": baseDisplay as any
    }
  };

  test("applies grid layout properties and normalises child positions", () => {
    const action = displayInstanceSetGridLayout({
      file: "file.bob",
      displayId: "display1",
      gridLayout: [{ i: "child1", x: 0, y: 0, w: 2, h: 2 }],
      gridLayoutColumns: 12,
      gridCellMargins: [5, 5],
      gridCellHeight: 30,
      gridCellDragEnabled: true,
      gridCellResizeEnabled: false
    });

    const state = fileCacheReducer(initialState, action);
    const display = state.fileCache["file.bob"];

    expect(display.gridLayoutColumns).toBe(12);
    expect(display.gridCellHeight).toBe(30);

    const child = display?.children?.[0];
    expect(child?.position).toMatchObject({
      x: "0",
      y: "0",
      width: "100%",
      height: "100%"
    });
  });

  test("does nothing if display not found", () => {
    const action = displayInstanceSetGridLayout({
      file: "file.bob",
      displayId: "missing",
      gridLayout: [],
      gridLayoutColumns: 12,
      gridCellMargins: [0, 0],
      gridCellHeight: 10,
      gridCellDragEnabled: true,
      gridCellResizeEnabled: true
    });

    const state = fileCacheReducer(initialState, action);
    expect(state).toEqual(initialState);
  });

  test("does nothing if wrong display type", () => {
    const badState: FileCacheState = {
      ...initialState,
      fileCache: {
        "file.bob": {
          ...baseDisplay,
          type: "shape" // wrong type
        } as any
      }
    };

    const action = displayInstanceSetGridLayout({
      file: "file.bob",
      displayId: "display1",
      gridLayout: [],
      gridLayoutColumns: 12,
      gridCellMargins: [0, 0],
      gridCellHeight: 10,
      gridCellDragEnabled: true,
      gridCellResizeEnabled: true
    });

    const state = fileCacheReducer(badState, action);
    expect(state).toEqual(badState);
  });
});

describe("FILE_CHANGED", (): void => {
  test("csReducer adds file to fileCache", (): void => {
    const contents: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    const fileName = "myfile.bob";
    const action: ReturnType<typeof fileChanged> = {
      type: "fileCache/fileChanged",
      payload: { file: fileName, contents: contents }
    };

    const newState = fileCacheReducer(initialState, action);
    expect(newState.fileCache[fileName]).toEqual(contents);
  });
});

describe("REFRESH_FILE", (): void => {
  test("csReducer deletes the file entry from fileCache", (): void => {
    const fileName = "mySecondFile.bob";
    const action: ReturnType<typeof refreshFile> = {
      type: "fileCache/refreshFile",
      payload: { file: fileName }
    };

    const newState = fileCacheReducer(initialState, action);
    expect(newState.fileCache[fileName]).toBeUndefined();
  });
});

describe("selectFile", (): void => {
  const state = createRootStoreState(undefined, undefined, initialState);

  it("finds file in fileCache", (): void => {
    const contents: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };

    const localState = {
      ...state,
      fileCache: {
        ...state.cs,
        fileCache: {
          ...state.fileCache.fileCache,
          "test.bob": contents
        }
      }
    };

    expect(selectFile(localState, "test.bob")).toEqual(contents);
  });

  it("returns undefined if device not in cache", (): void => {
    const localState = { ...state, fileCache: { ...state.cs, fileCache: {} } };
    expect(selectFile(localState, "test2.bob")).toBeUndefined();
  });
});

describe("makeSelectWidgetPosition", () => {
  const position = newAbsolutePosition("1", "2", "3", "4");

  const file = {
    id: "root",
    type: "display",
    fileId: "file",
    children: [
      {
        id: "child1",
        type: "shape",
        position
      }
    ]
  };

  const state = createRootStoreState(undefined, undefined, {
    fileCache: {
      "file.bob": file as any
    }
  });

  test("returns widget position when found", () => {
    const selector = makeSelectWidgetPosition();

    const result = selector(state, "file.bob", "child1");

    expect(result).toEqual(position);
  });

  test("returns undefined if widget not found", () => {
    const selector = makeSelectWidgetPosition();

    const result = selector(state, "file.bob", "missing");

    expect(result).toBeUndefined();
  });

  test("returns undefined if file not found", () => {
    const selector = makeSelectWidgetPosition();

    const result = selector(state, "missing.bob", "child1");

    expect(result).toBeUndefined();
  });

  test("memoizes results (same inputs)", () => {
    const selector = makeSelectWidgetPosition();

    const result1 = selector(state, "file.bob", "child1");
    const result2 = selector(state, "file.bob", "child1");

    expect(result1).toBe(result2);
  });
});

describe("fileComparator", (): void => {
  it("returns false if string contents don't match", (): void => {
    const contents1: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    const contents2: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("1", "0", "0", "0")
    };
    expect(fileComparator(contents1, contents2)).toBe(false);
  });

  it("returns false if number of keys changed", (): void => {
    const contents1: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0"),
      backgroundColor: ColorUtils.TRANSPARENT
    };
    const contents2: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };

    expect(fileComparator(contents1, contents2)).toBe(false);
  });

  it("returns true if matches", (): void => {
    const contents: WidgetDescription = {
      id: "123",
      fileId: "AShapeFile",
      type: "shape",
      position: newAbsolutePosition("0", "0", "0", "0")
    };
    expect(fileComparator(contents, { ...contents })).toBe(true);
  });
});
