import React, {
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import {
  ResponsiveLayouts,
  Responsive,
  useContainerWidth,
  Breakpoints,
  useResponsiveLayout,
  Breakpoint,
  Layout
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { Widget } from "../widget";
import { PVWidgetComponent, WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  ChoicePropOpt,
  ChildrenPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  BorderPropOpt,
  MacrosPropOpt,
  StringPropOpt,
  BoolPropOpt,
  StringArrayPropOpt,
  ObjectPropOpt,
  IntArrayPropOpt,
  IntPropOpt
} from "../propTypes";
import {
  MacroMap,
  MacroContext,
  MacroContextType
} from "../../../types/macros";
import { useStyle } from "../../hooks/useStyle";
import { useDebouncedValue } from "../../hooks/useDebounce";
import { useDispatch } from "react-redux";
import {
  calculateDefaultLayoutWithHorizontalCompactor,
  sameKeys
} from "./displayLayoutUtilities";
import {
  displayInstanceSetResponsiveLayout,
  displayInstanceUpdateResponsiveLayout
} from "../../../redux/slices/fileCacheSlice";
import log from "loglevel";
import { Dispatch } from "@reduxjs/toolkit";
import IconButton from "@mui/material/IconButton";
import CancelIcon from "@mui/icons-material/Cancel";

const widgetName = "displayResponsive";

// Default grid configuration
const defaultBreakpoints = { lg: 1200, md: 800, sm: 600, xs: 400, xxs: 250 }; // These are minimum widths in pixels
const defaultColumnWidth = 44;
const defaultRowHeight = 15;
const defaultMargins = [6, 6];

const DisplayResponsiveProps = {
  children: ChildrenPropOpt,
  overflow: ChoicePropOpt(["scroll", "hidden", "auto", "visible"]),
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  macros: MacrosPropOpt,
  scaling: StringArrayPropOpt,
  autoZoomToFit: BoolPropOpt,
  scalingOrigin: StringPropOpt,
  // New props for Responsive react-grid-layout
  responsiveLayouts: ObjectPropOpt,
  responsiveBreakpoints: ObjectPropOpt,
  responsiveColumns: ObjectPropOpt,
  gridCellDragEnabled: BoolPropOpt,
  gridCellResizeEnabled: BoolPropOpt,
  gridCellMargins: IntArrayPropOpt,
  gridCellHeight: IntPropOpt,
  editable: BoolPropOpt
};

type propsType = InferWidgetProps<typeof DisplayResponsiveProps> & {
  id: string;
  fileId: string;
  embeddedDisplayUuid: string;
};

// Display widget that uses react-grid-layout to provide a responsive drag and drop container
export const DisplayResponsiveComponent = (props: propsType): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
  const dispatch = useDispatch();

  const isInteractingRef = useRef(false);
  const shouldCommitRef = useRef(false);

  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true
  });
  const debouncedWidth = useDebouncedValue(width, 150);
  // Get base style from common CSS
  const [style, rawProps] = useStyle(props, widgetName);
  const newProps = rawProps as propsType;
  const gridCellDragEnabled =
    newProps?.gridCellDragEnabled == null
      ? true
      : newProps?.gridCellDragEnabled;
  const gridCellResizeEnabled =
    newProps?.gridCellResizeEnabled == null
      ? true
      : newProps?.gridCellResizeEnabled;

  const inheritedMacros: MacroMap = useContext(MacroContext).macros;
  const [displayMacros, setDisplayMacros] = useState<MacroMap>(
    newProps.macros ?? {}
  );

  const cellHeight = Number(newProps.gridCellHeight ?? defaultRowHeight);

  const updateMacro = useCallback((key: string, value: string) => {
    setDisplayMacros(prev => ({ ...prev, [key]: value }));
  }, []);

  const displayMacroContext = useMemo<MacroContextType>(
    () => ({
      updateMacro,
      macros: {
        ...inheritedMacros,
        ...displayMacros,
        DID: newProps.id
      }
    }),
    [updateMacro, inheritedMacros, displayMacros, newProps.id]
  );

  const extendedStyle = useMemo<React.CSSProperties>(
    () => ({
      ...style.colors,
      ...style.border,
      ...style.other,
      ...style.font,
      position: "relative",
      overflow: newProps.overflow,
      height: "100%",
      width: "100%"
    }),
    [style, newProps.overflow]
  );

  const cellMargins = (newProps.gridCellMargins ?? defaultMargins) as [
    number,
    number
  ];

  const childrenArray = useMemo(
    () =>
      React.Children.toArray(newProps.children as ReactNode[]).filter(child =>
        React.isValidElement<PVWidgetComponent>(child)
      ),
    [newProps.children]
  );

  const breakpoints = useMemo(
    () =>
      (newProps?.responsiveBreakpoints
        ? newProps.responsiveBreakpoints
        : defaultBreakpoints) as Breakpoints<Breakpoint>,
    [newProps.responsiveBreakpoints]
  );

  // Check that the breakpoints are consistent, between breakpoints, columns and layouts
  const areBreakpointsConsistent = useMemo(
    () =>
      (!newProps.responsiveColumns ||
        sameKeys(breakpoints, newProps.responsiveColumns)) &&
      (!newProps.responsiveLayouts ||
        sameKeys(breakpoints, newProps.responsiveLayouts)),
    [newProps.responsiveColumns, newProps.responsiveLayouts, breakpoints]
  );
  if (!areBreakpointsConsistent) {
    log.error(
      `Inconsistent breakpoint keys between breakpoints, columns, and layouts. Expected keys: ${Object.keys(breakpoints).join(", ")}. Falling back to defaults.`
    );
  }

  const columns: Breakpoints<Breakpoint> = useMemo(
    () =>
      calculateColumns(
        newProps.responsiveColumns as Breakpoints<Breakpoint>,
        areBreakpointsConsistent,
        breakpoints,
        cellMargins
      ),
    [
      newProps.responsiveColumns,
      breakpoints,
      cellMargins,
      areBreakpointsConsistent
    ]
  );

  useEffect(
    () =>
      calculateLayout(
        props.id,
        props.embeddedDisplayUuid,
        props.responsiveLayouts as ResponsiveLayouts<Breakpoint>,
        areBreakpointsConsistent,
        breakpoints,
        childrenArray,
        columns,
        cellMargins,
        cellHeight,
        dispatch,
        gridCellDragEnabled,
        gridCellResizeEnabled
      ),
    [
      dispatch,
      props.embeddedDisplayUuid,
      props.id,
      props.responsiveLayouts,
      childrenArray,
      columns,
      breakpoints,
      cellMargins,
      cellHeight,
      gridCellDragEnabled,
      gridCellResizeEnabled,
      areBreakpointsConsistent
    ]
  );

  const initialLayouts = useMemo(
    () => newProps.responsiveLayouts ?? ({} as ResponsiveLayouts<Breakpoint>),
    [newProps.responsiveLayouts]
  );

  const { layouts } = useResponsiveLayout({
    breakpoints,
    cols: columns,
    layouts: initialLayouts,
    width: 100
  });

  const handleDelete = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const newLayouts = Object.entries(layouts).reduce(
        (acc, [breakpoint, layout]) => {
          acc[breakpoint as Breakpoint] = (layout as Layout).filter(
            item => item.i !== id
          );
          return acc;
        },
        {} as ResponsiveLayouts<Breakpoint>
      );

      dispatch(
        displayInstanceUpdateResponsiveLayout({
          embeddedDisplayUuid: props.embeddedDisplayUuid,
          displayId: props.id,
          responsiveLayouts: newLayouts,
          update: {
            type: "delete",
            widgetId: id
          }
        })
      );
    },
    [dispatch, layouts, props.embeddedDisplayUuid, props.id]
  );

  // Wrap the child components in a div keyed by the child id. The key MUST map to the i field of Layout item for the component.
  const gridChildren = useMemo(
    () =>
      wrapChildrenForGridLayout(
        childrenArray,
        gridCellDragEnabled,
        newProps.editable,
        handleDelete
      ),
    [childrenArray, gridCellDragEnabled, newProps.editable, handleDelete]
  );

  const hasLayouts = useMemo(() => {
    return (
      newProps.responsiveLayouts &&
      Object.keys(newProps.responsiveLayouts).length > 0 &&
      Object.values(newProps.responsiveLayouts).every(
        layout => Array.isArray(layout) && layout.length > 0
      ) &&
      layouts &&
      Object.keys(layouts).length > 0
    );
  }, [newProps.responsiveLayouts, layouts]);

  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        style={extendedStyle}
        className="display-responsive-container"
      >
        {mounted && hasLayouts && (
          <Responsive
            key={`grid-${newProps.id}`}
            className="layout"
            layouts={layouts}
            breakpoints={breakpoints}
            cols={columns}
            rowHeight={cellHeight}
            margin={cellMargins}
            width={debouncedWidth}
            dragConfig={{
              enabled: gridCellDragEnabled,
              cancel: ".no-drag"
            }}
            resizeConfig={{
              enabled: gridCellResizeEnabled,
              handles: ["se"]
            }}
            onLayoutChange={(layout, layouts) => {
              if (!isInteractingRef.current && shouldCommitRef.current) {
                dispatch(
                  displayInstanceUpdateResponsiveLayout({
                    embeddedDisplayUuid: props.embeddedDisplayUuid,
                    displayId: props.id,
                    responsiveLayouts: layouts
                  })
                );
                shouldCommitRef.current = false;
              }
            }}
            onDragStart={(
              layout,
              oldItem,
              newItem,
              placeholder,
              e,
              element
            ) => {
              if (element?.style != null && gridCellDragEnabled) {
                element.style.cursor = "grabbing";
              }
              isInteractingRef.current = true;
            }}
            onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
              if (element?.style != null && gridCellDragEnabled) {
                element.style.cursor = "grab";
              }
              isInteractingRef.current = false;
              shouldCommitRef.current = true;
            }}
            onResizeStart={() => {
              isInteractingRef.current = true;
            }}
            onResizeStop={() => {
              isInteractingRef.current = false;
              shouldCommitRef.current = true;
            }}
            style={{
              ...style.colors,
              ...style.font,
              height: "100%"
            }}
          >
            {gridChildren}
          </Responsive>
        )}
      </div>
    </MacroContext.Provider>
  );
};

const DisplayResponsiveWidgetProps = {
  ...DisplayResponsiveProps,
  ...WidgetPropType
};

export const DisplayResponsive = (
  props: InferWidgetProps<typeof DisplayResponsiveWidgetProps>
): JSX.Element => <Widget baseWidget={DisplayResponsiveComponent} {...props} />;

registerWidget(DisplayResponsive, DisplayResponsiveWidgetProps, widgetName);

const calculateLayout = (
  id: string,
  embeddedDisplayUuid: string,
  responsiveLayouts: ResponsiveLayouts<Breakpoint>,
  areBreakpointsConsistent: boolean,
  breakpoints: Breakpoints<string>,
  childrenArray: React.ReactElement<
    PVWidgetComponent,
    string | React.JSXElementConstructor<any>
  >[],
  columns: Breakpoints<string>,
  cellMargins: [number, number],
  cellHeight: number,
  dispatch: Dispatch,
  gridCellDragEnabled: boolean,
  gridCellResizeEnabled: boolean
): void => {
  if (responsiveLayouts && areBreakpointsConsistent) {
    return;
  }

  // If a responsiveLayouts does not exist create one and update the redux state for this
  // responsive display.
  const computedResponsiveLayouts = Object.keys(breakpoints).reduce(
    (acc, key: string) => {
      acc[key as Breakpoint] = calculateDefaultLayoutWithHorizontalCompactor(
        childrenArray,
        breakpoints[key as Breakpoint],
        columns[key as Breakpoint],
        cellMargins,
        cellHeight
      );
      return acc;
    },
    {} as ResponsiveLayouts<Breakpoint>
  );

  dispatch(
    displayInstanceSetResponsiveLayout({
      embeddedDisplayUuid,
      displayId: id,
      responsiveLayouts: computedResponsiveLayouts,
      responsiveColumns: columns,
      responsiveBreakpoints: breakpoints,
      gridCellMargins: cellMargins,
      gridCellHeight: cellHeight,
      gridCellDragEnabled,
      gridCellResizeEnabled
    })
  );
};

const calculateColumns = (
  responsiveColumns: Breakpoints<Breakpoint>,
  areBreakpointsConsistent: boolean,
  breakpoints: Breakpoints<string>,
  cellMargins: [number, number]
): Breakpoints<string> => {
  if (responsiveColumns && areBreakpointsConsistent) {
    return responsiveColumns as Breakpoints<Breakpoint>;
  }

  return Object.keys(breakpoints).reduce((acc, key: Breakpoint) => {
    acc[key] = Math.round(
      (breakpoints[key] - cellMargins[0]) /
        (defaultColumnWidth + cellMargins[0])
    );
    return acc;
  }, {} as Breakpoints<Breakpoint>);
};

const wrapChildrenForGridLayout = (
  childrenArray: React.ReactElement<
    PVWidgetComponent,
    string | React.JSXElementConstructor<any>
  >[],
  gridCellDragEnabled: boolean,
  editable: boolean | undefined,
  handleDelete: (id: string, event: React.MouseEvent) => void
) => {
  return childrenArray.map(child => {
    const id = child.props.id;
    if (!id) {
      throw new Error("All grid items must have a stable id");
    }

    return (
      <div
        key={id}
        className="display-grid-layout-child"
        style={{ cursor: gridCellDragEnabled ? "grab" : "default" }}
      >
        {editable && (
          <IconButton
            aria-label={`Delete widget ${id}`}
            size="small"
            onMouseDown={e => {
              // Prevent default drag action
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={e => handleDelete(id, e)}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              zIndex: 20,
              width: 24,
              height: 24,
              padding: 0,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "error",
              // Invisible by default
              opacity: 0,
              visibility: "hidden",
              pointerEvents: "none",
              // Show on hover
              ".display-grid-layout-child:hover &": {
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto"
              },
              "&:hover": {
                backgroundColor: "#fff",
                color: "error.dark"
              }
            }}
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        )}
        {child}
      </div>
    );
  });
};
