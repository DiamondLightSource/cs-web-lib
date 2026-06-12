// fileCacheSlice.ts
import {
  createSlice,
  PayloadAction,
  createSelector,
  current
} from "@reduxjs/toolkit";
import {
  injectFieldsIntoAllDescriptions,
  WidgetDescription
} from "../../ui/widgets/createComponent";
import { findWidgetById } from "./storeUtils";
import { Position } from "../../types";
import { MacroMap } from "../../types/macros";
import stringify from "safe-stable-stringify";
import { Breakpoints, Layout, ResponsiveLayouts } from "react-grid-layout";

export interface FileCache {
  [fileId: string]: WidgetDescription;
}

export interface DisplayInstance {
  description: WidgetDescription;
  fileId: string;
  macros: MacroMap;
  hash: string;
  uuid: string; // universally unique id for a display
}

export interface DisplayInstanceCache {
  [uuid: string]: DisplayInstance;
}

export interface FileCacheState {
  // The file cache should represent files loaded from the server, it should be immutable.
  fileCache: FileCache;

  // The display instance cache contains a instances of the displays,
  // these have had some macros applied and are mutable representations of embedded displays.
  displayInstanceCache: DisplayInstanceCache;

  // A combination of file path and macro set can be used to look-up the display instance uuid
  displayInstanceIndex: {
    [hash: string]: string;
  };
}

const initialState: FileCacheState = {
  fileCache: {},
  displayInstanceCache: {},
  displayInstanceIndex: {}
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

      Object.entries(state.displayInstanceCache).forEach(([uuid, inst]) => {
        if (inst.fileId === action.payload.file) {
          if (state.displayInstanceIndex[inst.hash] === uuid) {
            delete state.displayInstanceIndex[inst.hash];
          }
          delete state.displayInstanceCache[uuid];
        }
      });
    },

    displayInstanceSetGridLayout(
      state,
      action: PayloadAction<{
        embeddedDisplayUuid: string;
        gridDisplayId: string;
        gridLayout: Layout;
        gridLayoutColumns: number;
        gridCellMargins: [number, number];
        gridCellHeight: number;
        gridCellDragEnabled: boolean;
        gridCellResizeEnabled: boolean;
      }>
    ) {
      const {
        embeddedDisplayUuid,
        gridDisplayId,
        gridLayout,
        gridLayoutColumns,
        gridCellMargins,
        gridCellHeight,
        gridCellDragEnabled,
        gridCellResizeEnabled
      } = action.payload;

      const displayInstance = state.displayInstanceCache?.[embeddedDisplayUuid];
      if (!displayInstance) {
        return;
      }

      const display = findWidgetById(
        [displayInstance.description],
        gridDisplayId
      );

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

    displayInstanceSetResponsiveLayout(
      state,
      action: PayloadAction<{
        embeddedDisplayUuid: string;
        displayId: string;
        responsiveLayouts: ResponsiveLayouts<string>;
        responsiveColumns: Breakpoints<string>;
        responsiveBreakpoints: Breakpoints<string>;
        gridCellMargins: [number, number];
        gridCellHeight: number;
        gridCellDragEnabled: boolean;
        gridCellResizeEnabled: boolean;
      }>
    ) {
      const {
        embeddedDisplayUuid,
        displayId,
        responsiveLayouts,
        responsiveColumns,
        responsiveBreakpoints,
        gridCellMargins,
        gridCellHeight,
        gridCellDragEnabled,
        gridCellResizeEnabled
      } = action.payload;

      const displayInstance = state.displayInstanceCache?.[embeddedDisplayUuid];
      if (!displayInstance) return;

      const display = findWidgetById([displayInstance.description], displayId);

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

    displayInstanceUpdateResponsiveLayout(
      state,
      action: PayloadAction<{
        embeddedDisplayUuid: string;
        displayId: string;
        responsiveLayouts: ResponsiveLayouts<string>;
      }>
    ) {
      const { embeddedDisplayUuid, displayId, responsiveLayouts } =
        action.payload;

      const displayInstance = state.displayInstanceCache[embeddedDisplayUuid];
      const display = findWidgetById([displayInstance.description], displayId);

      if (!display || display.type !== "displayResponsive") return;
      display.responsiveLayouts = responsiveLayouts;
    },

    createDisplayInstanceFromFile(state, action) {
      const { file, macros } = action.payload;
      const fileDescription = state.fileCache?.[file];

      const hash = `${file}::${stringify(macros)}`;

      if (
        Object.values(state?.displayInstanceCache ?? {}).some(
          inst => inst.hash === hash
        )
      ) {
        return;
      }

      const uuid = crypto.randomUUID();
      const description = structuredClone(current(fileDescription));
      injectFieldsIntoAllDescriptions(description, {
        embeddedDisplayUuid: uuid
      });

      if (state.displayInstanceCache) {
        state.displayInstanceCache[uuid] = {
          description: description,
          fileId: file,
          macros: macros,
          uuid,
          hash
        };

        state.displayInstanceIndex[hash] = uuid;
      }
    }
  },
  selectors: {
    selectFileCache: state => state.fileCache,
    selectDisplayInstanceCache: state => state.displayInstanceCache,
    selectDisplayInstanceIndex: state => state.displayInstanceIndex
  }
});

export const {
  fileChanged,
  refreshFile,
  displayInstanceSetGridLayout,
  displayInstanceSetResponsiveLayout,
  displayInstanceUpdateResponsiveLayout,
  createDisplayInstanceFromFile
} = fileCacheSlice.actions;

export default fileCacheSlice.reducer;

export const {
  selectFileCache,
  selectDisplayInstanceCache,
  selectDisplayInstanceIndex
} = fileCacheSlice.selectors;

export const selectFile = createSelector(
  [selectFileCache, (_state, fileId: string) => fileId],
  (fileCache, fileId) => fileCache[fileId]
);

export const selectDisplayInstance = createSelector(
  [selectDisplayInstanceCache, (_state, uuid: string) => uuid],
  (displayInstanceCache, uuid) => displayInstanceCache?.[uuid]
);

export const selectDisplayInstanceByFileAndMacros = createSelector(
  [
    selectDisplayInstanceIndex,
    selectDisplayInstanceCache,
    (_state, file: string) => file,
    (_state, _file, macros: MacroMap) => macros
  ],
  (index, displayInstanceCache, file, macros) => {
    const hash = `${file}::${stringify(macros)}`;
    const id = index?.[hash];
    return id ? displayInstanceCache?.[id] : undefined;
  }
);

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
