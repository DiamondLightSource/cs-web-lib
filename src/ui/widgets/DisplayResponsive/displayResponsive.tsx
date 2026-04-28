import React, { useState, useContext, ReactNode } from "react";
import {
  Layout,
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

const widgetName = "displayResponsive";

// Default grid configuration
const defaultBreakpoints = { lg: 1200, md: 600, sm: 300 }; // These are minimum widths in pixels
const defaultCols = { lg: 32, md: 16, sm: 8 };
const defaultRowHeight = 15;
const defaultMArgins = [6, 6];

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
  responsiveDragEnabled: BoolPropOpt,
  responsiveResizeEnabled: BoolPropOpt,
  responsiveCellMargins: IntArrayPropOpt,
  responsiveCellHeight: IntPropOpt,
  rowHeight: StringPropOpt,
  isDraggable: BoolPropOpt,
  isResizable: BoolPropOpt
};

// Display widget that uses react-grid-layout to provide a responsive drag and drop container
export const DisplayResponsiveComponent = (
  props: InferWidgetProps<typeof DisplayResponsiveProps> & { id: string }
): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: false
  });
  const debouncedWidth = useDebouncedValue(width, 150);
  const responsiveDragEnabled =
    props?.responsiveDragEnabled == null ? true : props?.responsiveDragEnabled;
  const responsiveResizeEnabled =
    props?.responsiveResizeEnabled == null
      ? true
      : props?.responsiveResizeEnabled;

  const inheritedMacros: MacroMap = useContext(MacroContext).macros;
  const [displayMacros, setDisplayMacros] = useState<MacroMap>(
    props.macros ?? {}
  );

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
      height: "100%"
    }),
    [style, props.overflow]
  );

  const cellMargins = (props.responsiveCellMargins ?? defaultMArgins) as [
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
        ? { ...defaultBreakpoints, ...props.responsiveBreakpoints }
        : defaultBreakpoints) as Breakpoints<string>,
    [props.responsiveBreakpoints]
  );

  const columns = React.useMemo(
    () =>
      (props.responsiveColumns
        ? { ...defaultCols, ...props.responsiveColumns }
        : defaultCols) as Breakpoints<DefaultBreakpoints>,
    [props.responsiveColumns]
  );

  const initialLayouts = React.useMemo(
    () =>
      (props.responsiveLayouts ??
        calculateDefaultLayouts(
          childrenArray
        )) as ResponsiveLayouts<Breakpoint>,
    [props.responsiveLayouts, childrenArray]
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
          <div key={id} style={{ cursor: "grab" }}>
            {child}
          </div>
        );
      }),
    [childrenArray]
  );

  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        style={extendedStyle}
        className="display-responsive-container"
      >
        {mounted && (
          <Responsive
            key={`grid-${props.id}`}
            className="layout"
            layouts={layouts}
            breakpoints={breakpoints}
            cols={columns}
            rowHeight={Number(props.rowHeight ?? defaultRowHeight)}
            margin={cellMargins}
            width={debouncedWidth}
            dragConfig={{
              enabled: responsiveDragEnabled,
              cancel: ".no-drag"
            }}
            resizeConfig={{
              enabled: responsiveResizeEnabled,
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
              if (element?.style != null) {
                element.style.cursor = "grabbing";
              }
            }}
            onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
              if (element?.style != null) {
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

const calculateDefaultLayouts = (
  childrenArray: React.ReactElement<PVWidgetComponent>[]
): ResponsiveLayouts => {
  return {
    lg: childrenArray.map((child, i) => ({
      i: child.props.id,
      x: (i % 4) * 8,
      y: Math.floor(i / 4),
      w: 8,
      h: 4
    })) as Layout,

    md: childrenArray.map((child, i) => ({
      i: child.props.id,
      x: (i % 2) * 8,
      y: Math.floor(i / 2),
      w: 8,
      h: 4
    })) as Layout,

    sm: childrenArray.map((child, i) => ({
      i: child.props.id,
      x: 0,
      y: i,
      w: 8,
      h: 4
    })) as Layout
  };
};
export const DisplayResponsive = (
  props: InferWidgetProps<typeof DisplayResponsiveWidgetProps>
): JSX.Element => <Widget baseWidget={DisplayResponsiveComponent} {...props} />;

registerWidget(DisplayResponsive, DisplayResponsiveWidgetProps, widgetName);
