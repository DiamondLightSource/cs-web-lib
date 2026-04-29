import React, { useState, useContext, ReactNode } from "react";
import {
  Layout,
  useContainerWidth,
  useGridLayout,
  ReactGridLayout,
  verticalCompactor
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
  IntPropOpt,
  ObjectArrayPropOpt,
  IntArrayPropOpt
} from "../propTypes";
import {
  MacroMap,
  MacroContext,
  MacroContextType
} from "../../../types/macros";
import { useStyle } from "../../hooks/useStyle";
import { useDebouncedValue } from "../../hooks/useDebounce";

const widgetName = "displayGridLayout";

// Default grid configuration
const defaultCols = 32;
const defaultRowHeight = 15;
const defaultMargins = [6, 6];

const DisplayGridLayoutProps = {
  children: ChildrenPropOpt,
  overflow: ChoicePropOpt(["scroll", "hidden", "auto", "visible"]),
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  macros: MacrosPropOpt,
  scaling: StringArrayPropOpt,
  autoZoomToFit: BoolPropOpt,
  scalingOrigin: StringPropOpt,
  // New props for react-grid-layout
  gridCellDragEnabled: BoolPropOpt,
  gridCellResizeEnabled: BoolPropOpt,
  gridCellHeight: IntPropOpt,
  gridCellMargins: IntArrayPropOpt,
  gridLayoutColumns: IntPropOpt,
  gridLayout: ObjectArrayPropOpt
};

// Display widget that uses react-grid-layout to provide a responsive drag and drop container
export const DisplayGridLayoutComponent = (
  props: InferWidgetProps<typeof DisplayGridLayoutProps> & { id: string }
): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
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

  const cellMargins = (props.gridCellMargins ?? defaultMargins) as [
    number,
    number
  ];

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

  const childrenArray = React.useMemo(
    () =>
      React.Children.toArray(props.children as ReactNode[]).filter(child =>
        React.isValidElement<PVWidgetComponent>(child)
      ),
    [props.children]
  );

  const columns = React.useMemo(
    () => props.gridLayoutColumns ?? defaultCols,
    [props.gridLayoutColumns]
  );

  const initialLayout = React.useMemo(
    () => (props.gridLayout ?? calculateDefaultLayout(childrenArray)) as Layout,
    [props.gridLayout, childrenArray]
  );

  const { layout } = useGridLayout({
    layout: initialLayout,
    cols: columns
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
        className="display-grid-layout-container"
      >
        {mounted && (
          <ReactGridLayout
            key={`grid-${props.id}`}
            className="layout"
            layout={layout}
            width={debouncedWidth}
            gridConfig={{
              cols: columns,
              margin: cellMargins,
              rowHeight: Number(props.gridCellHeight ?? defaultRowHeight)
            }}
            dragConfig={{
              enabled: gridCellDragEnabled,
              cancel: ".no-drag"
            }}
            resizeConfig={{ enabled: gridCellResizeEnabled, handles: ["se"] }}
            compactor={verticalCompactor}
            onDragStart={(
              layout,
              oldItem,
              newItem,
              placeholder,
              e,
              element
            ) => {
              if (element?.style && gridCellDragEnabled)
                element.style.cursor = "grabbing";
            }}
            onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
              if (element?.style && gridCellDragEnabled)
                element.style.cursor = "grab";
            }}
            style={{
              ...style.colors,
              ...style.font,
              height: "100%"
            }}
          >
            {gridChildren}
          </ReactGridLayout>
        )}
      </div>
    </MacroContext.Provider>
  );
};

const DisplayGridLayoutWidgetProps = {
  ...DisplayGridLayoutProps,
  ...WidgetPropType
};

const calculateDefaultLayout = (
  childrenArray: React.ReactElement<PVWidgetComponent>[]
): Layout =>
  childrenArray.map((child, i) => ({
    i: child.props.id,
    x: (i % 4) * 8,
    y: Math.floor(i / 4),
    w: 8,
    h: 4
  })) as Layout;

export const DisplayGridLayout = (
  props: InferWidgetProps<typeof DisplayGridLayoutWidgetProps>
): JSX.Element => <Widget baseWidget={DisplayGridLayoutComponent} {...props} />;

registerWidget(DisplayGridLayout, DisplayGridLayoutWidgetProps, widgetName);
