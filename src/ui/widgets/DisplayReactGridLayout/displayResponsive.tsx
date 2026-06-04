import React, { useState, useContext, ReactNode, useEffect } from "react";
import {
  ResponsiveLayouts,
  Responsive,
  useContainerWidth,
  Breakpoints,
  useResponsiveLayout,
  DefaultBreakpoints,
  Breakpoint
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
import { calculateDefaultLayoutWithHorizontalCompactor } from "./displayLayoutUtilities";
import { fileDisplaySetResponsiveLayout } from "../../../redux/csState";

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
  gridCellHeight: IntPropOpt
};

// Display widget that uses react-grid-layout to provide a responsive drag and drop container
export const DisplayResponsiveComponent = (
  props: InferWidgetProps<typeof DisplayResponsiveProps> & {
    id: string;
    fileId: string;
  }
): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
  const dispatch = useDispatch();
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: false
  });
  const debouncedWidth = useDebouncedValue(width, 150);
  const gridCellDragEnabled =
    props?.gridCellDragEnabled == null ? true : props?.gridCellDragEnabled;
  const gridCellResizeEnabled =
    props?.gridCellResizeEnabled == null ? true : props?.gridCellResizeEnabled;

  const inheritedMacros: MacroMap = useContext(MacroContext).macros;
  const [displayMacros, setDisplayMacros] = useState<MacroMap>(
    props.macros ?? {}
  );

  const cellHeight = Number(props.gridCellHeight ?? defaultRowHeight);

  const updateMacro = React.useCallback((key: string, value: string) => {
    setDisplayMacros(prev => ({ ...prev, [key]: value }));
  }, []);

  const displayMacroContext = React.useMemo<MacroContextType>(
    () => ({
      updateMacro,
      macros: {
        ...inheritedMacros,
        ...displayMacros,
        DID: props.id
      }
    }),
    [updateMacro, inheritedMacros, displayMacros, props.id]
  );

  // Get base style from common CSS
  const style = useStyle(props, widgetName);
  const extendedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...style.colors,
      ...style.border,
      ...style.other,
      ...style.font,
      position: "relative",
      overflow: props.overflow,
      height: "100%",
      width: "100%"
    }),
    [style, props.overflow]
  );

  const cellMargins = (props.gridCellMargins ?? defaultMargins) as [
    number,
    number
  ];

  const childrenArray = React.useMemo(
    () =>
      React.Children.toArray(props.children as ReactNode[]).filter(child =>
        React.isValidElement<PVWidgetComponent>(child)
      ),
    [props.children]
  );

  const breakpoints = React.useMemo(
    () =>
      (props?.responsiveBreakpoints
        ? props.responsiveBreakpoints
        : defaultBreakpoints) as Breakpoints<string>,
    [props.responsiveBreakpoints]
  );

  const columns = React.useMemo(() => {
    if (props.responsiveColumns) {
      return props.responsiveColumns as Breakpoints<Breakpoint>;
    }

    return Object.keys(breakpoints).reduce((acc, key: string) => {
      acc[key as DefaultBreakpoints] = Math.round(
        (breakpoints[key] - cellMargins[0]) /
          (defaultColumnWidth + cellMargins[0])
      );
      return acc;
    }, {} as Breakpoints<Breakpoint>);
  }, [props.responsiveColumns, breakpoints, cellMargins]);

  useEffect(() => {
    if (props.responsiveLayouts) {
      return;
    }
    // If a responsiveLayouts does not exist create one and update the redux state for this
    // responsive display.
    const responsiveLayouts = Object.keys(columns).reduce(
      (acc, key: string) => {
        acc[key as DefaultBreakpoints] =
          calculateDefaultLayoutWithHorizontalCompactor(
            childrenArray,
            breakpoints[key as DefaultBreakpoints],
            columns[key as DefaultBreakpoints],
            cellMargins,
            cellHeight
          );
        return acc;
      },
      {} as ResponsiveLayouts<Breakpoint>
    );

    dispatch(
      fileDisplaySetResponsiveLayout({
        file: props.fileId,
        displayId: props.id,
        responsiveLayouts,
        responsiveColumns: columns,
        responsiveBreakpoints: breakpoints,
        gridCellMargins: cellMargins,
        gridCellHeight: cellHeight,
        gridCellDragEnabled,
        gridCellResizeEnabled
      })
    );
  }, [
    dispatch,
    props.fileId,
    props.id,
    props.responsiveLayouts,
    childrenArray,
    columns,
    breakpoints,
    cellMargins,
    cellHeight,
    gridCellDragEnabled,
    gridCellResizeEnabled
  ]);

  const initialLayouts = React.useMemo(
    () => props.responsiveLayouts ?? ({} as ResponsiveLayouts<Breakpoint>),
    [props.responsiveLayouts]
  );

  const { layouts } = useResponsiveLayout({
    breakpoints,
    cols: columns,
    layouts: initialLayouts,
    width: 0
  });

  // Wrap the child components in a div keyed by the child id. The key MUST map to the i field of Layout item for the component.
  const gridChildren = React.useMemo(
    () =>
      childrenArray.map(child => {
        const id = child.props.id;
        if (!id) {
          throw new Error("All grid items must have a stable id");
        }

        return (
          <div
            key={id}
            style={{ cursor: gridCellDragEnabled ? "grab" : "default" }}
          >
            {child}
          </div>
        );
      }),
    [childrenArray, gridCellDragEnabled]
  );

  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        style={extendedStyle}
        className="display-responsive-container"
      >
        {mounted && props.responsiveLayouts && (
          <Responsive
            key={`grid-${props.id}`}
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
            }}
            onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
              if (element?.style != null && gridCellDragEnabled) {
                element.style.cursor = "grab";
              }
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
