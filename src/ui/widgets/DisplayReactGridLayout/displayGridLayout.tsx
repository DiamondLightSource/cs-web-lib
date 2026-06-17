import React, {
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect
} from "react";
import {
  Layout,
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
  IntArrayPropOpt,
  PositionProp
} from "../propTypes";
import {
  MacroMap,
  MacroContext,
  MacroContextType
} from "../../../types/macros";
import { useStyle } from "../../hooks/useStyle";
import { calculateDefaultLayout, toNumber } from "./displayLayoutUtilities";
import {
  displayInstanceSetGridLayout,
  makeSelectWidgetPosition
} from "../../../redux/slices/fileCacheSlice";
import { useDispatch, useSelector } from "react-redux";

const widgetName = "displayGridLayout";

// Default grid configuration
const defaultRowHeight = 15;
const defaultColumnWidth = 64;
const defaultMargins = [6, 6];

const DisplayGridLayoutProps = {
  position: PositionProp,
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
  props: InferWidgetProps<typeof DisplayGridLayoutProps> & {
    id: string;
    fileId: string;
    embeddedDisplayUuid: string;
  }
): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
  const dispatch = useDispatch();
  const gridCellDragEnabled =
    props?.gridCellDragEnabled == null ? true : props?.gridCellDragEnabled;
  const gridCellResizeEnabled =
    props?.gridCellResizeEnabled == null ? true : props?.gridCellResizeEnabled;

  const inheritedMacros: MacroMap = useContext(MacroContext).macros;
  const [displayMacros, setDisplayMacros] = useState<MacroMap>(
    props.macros ?? {}
  );

  const selectWidgetPosition = useMemo(makeSelectWidgetPosition, []);
  const position = useSelector(state =>
    selectWidgetPosition(state, props.embeddedDisplayUuid, props.id)
  );
  const displayWidth = toNumber(position?.width, 1200);
  const cellHeight = Number(props.gridCellHeight ?? defaultRowHeight);
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
      height: "100%",
      width: "100%"
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
    () =>
      props.gridLayoutColumns ??
      Math.round(
        (displayWidth - cellMargins[0]) / (defaultColumnWidth + cellMargins[0])
      ),
    [props.gridLayoutColumns, cellMargins, displayWidth]
  );

  useEffect(() => {
    if (props.gridLayout) {
      return;
    }

    // If a gridLayout does not exist create one and update the redux state for this
    // display grid.
    const calculatedLayout = calculateDefaultLayout(
      childrenArray,
      displayWidth,
      columns,
      cellMargins,
      cellHeight
    );
    dispatch(
      displayInstanceSetGridLayout({
        embeddedDisplayUuid: props.embeddedDisplayUuid,
        gridDisplayId: props.id,
        gridLayout: calculatedLayout,
        gridLayoutColumns: columns,
        gridCellMargins: cellMargins,
        gridCellHeight: cellHeight,
        gridCellDragEnabled,
        gridCellResizeEnabled
      })
    );
  }, [
    dispatch,
    props.embeddedDisplayUuid,
    props.id,
    props.gridLayout,
    childrenArray,
    columns,
    displayWidth,
    cellMargins,
    cellHeight,
    gridCellDragEnabled,
    gridCellResizeEnabled
  ]);

  const { layout } = useGridLayout({
    layout: (props.gridLayout || []) as Layout,
    cols: columns
  });

  // Wrap the child components in a div keyed by the child id. The key MUST map to the i field of Layout item for the component.
  const gridChildren = useMemo(
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
      <div style={extendedStyle} className="display-grid-layout-container">
        {layout && layout.length > 0 && (
          <ReactGridLayout
            key={`grid-${props.id}`}
            className="layout"
            layout={layout}
            width={displayWidth}
            gridConfig={{
              cols: columns,
              margin: cellMargins,
              rowHeight: cellHeight
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

export const DisplayGridLayout = (
  props: InferWidgetProps<typeof DisplayGridLayoutWidgetProps>
): JSX.Element => <Widget baseWidget={DisplayGridLayoutComponent} {...props} />;

registerWidget(DisplayGridLayout, DisplayGridLayoutWidgetProps, widgetName);
