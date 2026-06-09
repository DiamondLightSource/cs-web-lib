// fileCacheSlice.ts
import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { WidgetDescription } from "../../ui/widgets/createComponent";
import { findWidgetById } from "./storeUtils";
import { Position } from "../../types";

export interface FileCache {
  [fileName: string]: WidgetDescription;
}

export interface FileCacheState {
  fileCache: FileCache;
}

const initialState: FileCacheState = {
  fileCache: {}
};

const fileCacheSlice = createSlice({
  name: "fileCache",
  initialState,
  reducers: {
    fileChanged(
      state,
      action: PayloadAction<{ file: string; contents: WidgetDescription }>
    ) {
      const { file, contents } = action.payload;
      state.fileCache[file] = contents;
    },

    refreshFile(state, action: PayloadAction<{ file: string }>) {
      delete state.fileCache[action.payload.file];
    },

    fileDisplaySetGridLayout(state, action) {
      const {
        file,
        displayId,
        gridLayout,
        gridLayoutColumns,
        gridCellMargins,
        gridCellHeight,
        gridCellDragEnabled,
        gridCellResizeEnabled
      } = action.payload;

      const fileDescription = state.fileCache[file];
      const display = findWidgetById([fileDescription], displayId);

      if (!display || display.type !== "displayGridLayout") return;

      display.gridLayout = gridLayout;
      display.gridCellHeight = gridCellHeight;
      display.gridCellMargins = gridCellMargins;
      display.gridLayoutColumns = gridLayoutColumns;
      display.gridCellDragEnabled = gridCellDragEnabled;
      display.gridCellResizeEnabled = gridCellResizeEnabled;

      display.children?.forEach(c => {
        if (c.position) {
          c.position = {
            ...c.position,
            x: "0",
            y: "0",
            width: "100%",
            height: "100%"
          };
        }
      });
    },

    fileDisplaySetResponsiveLayout(state, action) {
      const {
        file,
        displayId,
        responsiveLayouts,
        responsiveColumns,
        responsiveBreakpoints,
        gridCellMargins,
        gridCellHeight,
        gridCellDragEnabled,
        gridCellResizeEnabled
      } = action.payload;

      const fileDescription = state.fileCache[file];
      const display = findWidgetById([fileDescription], displayId);

      if (!display || display.type !== "displayResponsive") return;

      display.responsiveLayouts = responsiveLayouts;
      display.responsiveColumns = responsiveColumns;
      display.responsiveBreakpoints = responsiveBreakpoints;
      display.gridCellHeight = gridCellHeight;
      display.gridCellMargins = gridCellMargins;
      display.gridCellDragEnabled = gridCellDragEnabled;
      display.gridCellResizeEnabled = gridCellResizeEnabled;

      if (display.position) {
        display.position.width = "100%";
      }

      display.children?.forEach(c => {
        if (c.position) {
          c.position = {
            ...c.position,
            x: "0",
            y: "0",
            width: "100%",
            height: "100%"
          };
        }
      });
    },
    fileDisplayUpdateResponsiveLayout(state, action) {
      const { file, displayId, responsiveLayouts } = action.payload;

      const fileDescription = state.fileCache[file];
      const display = findWidgetById([fileDescription], displayId);

      if (!display || display.type !== "displayResponsive") return;
      display.responsiveLayouts = responsiveLayouts;
    }
  },
  selectors: {
    selectFileCache: state => state.fileCache
  }
});

export const {
  fileChanged,
  refreshFile,
  fileDisplaySetGridLayout,
  fileDisplaySetResponsiveLayout,
  fileDisplayUpdateResponsiveLayout
} = fileCacheSlice.actions;

export default fileCacheSlice.reducer;

export const { selectFileCache } = fileCacheSlice.selectors;

export const selectFile = createSelector(
  [selectFileCache, (_state, fileId: string) => fileId],
  (fileCache, fileId) => fileCache[fileId]
);

export const fileComparator = (
  before: WidgetDescription,
  after: WidgetDescription
): boolean => {
  if (!before || !after) {
    return false;
  }
  if (Object.keys(before).length !== Object.keys(after).length) {
    return false;
  }
  if (before.children?.length !== after.children?.length) {
    return false;
  }
  // Can't compare objects directly because they are in different memory locations
  // But we can compare strings
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    return false;
  }
  return true;
};

/**
 * This selector factory provides an alternative means for a widget to get its
 * position props. Generally the <Widget> wrapper should manage position and the
 * useContainerWidth hook should be used to get a measured width and height.
 * But in some rare situations these props need be be known before first render
 * and are not expected to change, for example through a react grid layout resize.
 * @returns A new selector that gets the widget position properties
 */
export const makeSelectWidgetPosition = () =>
  createSelector(
    [selectFile, (_state: any, _fileId: string, widgetId: string) => widgetId],
    (file, widgetId) =>
      file
        ? (findWidgetById([file], widgetId)?.position as Position | undefined)
        : undefined
  );
