import React, {
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
  useCallback
} from "react";
import {
  Layout,
  useGridLayout,
  ReactGridLayout,
  getCompactor
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
import {
  calculateDefaultLayout,
  CrossGridDragData,
  toNumber
} from "./displayLayoutUtilities";
import {
  displayInstanceSetGridLayout,
  displayInstanceUpdateGridLayout,
  displayInstanceMoveWidgetBetweenGridLayouts,
  makeSelectWidgetPosition
} from "../../../redux/slices/fileCacheSlice";
import { useDispatch, useSelector } from "react-redux";
import IconButton from "@mui/material/IconButton";
import CancelIcon from "@mui/icons-material/Cancel";

const widgetName = "displayGridLayout";

// Default grid configuration
const defaultRowHeight = 15;
const defaultColumnWidth = 64;
const defaultMargins = [6, 6];

let activeCrossGridDrag: CrossGridDragData | null = null;

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
  gridLayout: ObjectArrayPropOpt,
  editable: BoolPropOpt
};

const overlapCompactor = getCompactor(
  null, // use no compactor so elements can float
  true, // allow overlap
  false // dont avoid collisions
);

type DisplayGridLayoutComponentProps = InferWidgetProps<
  typeof DisplayGridLayoutProps
> & {
  id: string;
  fileId: string;
  embeddedDisplayUuid: string;
};

// Display widget that uses react-grid-layout to provide a responsive drag and drop container
export const DisplayGridLayoutComponent = (
  props: DisplayGridLayoutComponentProps
): JSX.Element => {
  // Macros specific to this display. Children of this component
  // can set macros by using the updateMacro function on the
  // context.
  const dispatch = useDispatch();
  const gridCellDragEnabled =
    props?.gridCellDragEnabled == null ? true : props?.gridCellDragEnabled;
  const gridCellResizeEnabled =
    props?.gridCellResizeEnabled == null ? true : props?.gridCellResizeEnabled;

  const canReceiveCrossGridDrop = props.editable === true;
  const canExportCrossGridDrop = props.editable === false;

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
  const [style, rawProps] = useStyle(props, widgetName);
  const newProps = rawProps as DisplayGridLayoutComponentProps;
  const extendedStyle = React.useMemo<React.CSSProperties>(
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

  const childrenArray = React.useMemo(
    () =>
      React.Children.toArray(newProps.children as ReactNode[]).filter(child =>
        React.isValidElement<PVWidgetComponent>(child)
      ),
    [newProps.children]
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

  const {
    layout,
    isInteracting,
    dragState,
    onDragStart: hookOnDragStart,
    onDragStop: hookOnDragStop,
    onResizeStop: hookOnResizeStop
  } = useGridLayout({
    layout: (props.gridLayout || []) as Layout,
    cols: columns
  });

  const handleDelete = React.useCallback(
    (id: string, event: React.MouseEvent) => {
      // Prevent default actions on click e.g drag
      event.preventDefault();
      event.stopPropagation();

      const newLayout = layout.filter(item => item.i !== id);
      dispatch(
        displayInstanceUpdateGridLayout({
          embeddedDisplayUuid: props.embeddedDisplayUuid,
          gridDisplayId: props.id,
          gridLayout: newLayout,
          update: {
            type: "delete",
            widgetId: id
          }
        })
      );
    },
    [dispatch, layout, props.embeddedDisplayUuid, props.id]
  );

  const getMacrosToTransfer = useCallback((): MacroMap => {
    // Remove DID macro because new screen has its own
    const { DID: _did, ...macros } = displayMacroContext.macros;

    return macros;
  }, [displayMacroContext.macros]);

  // handle dragging out of display and into new one
  const handleCrossGridDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, widgetId: string) => {
      if (!canExportCrossGridDrop) {
        event.preventDefault();
        return;
      }

      const layoutItem = layout.find(item => item.i === widgetId);
      if (!layoutItem) {
        event.preventDefault();
        return;
      }

      const dragData: CrossGridDragData = {
        widgetId,
        sourceGridId: props.id,
        sourceEmbeddedDisplayUuid: props.embeddedDisplayUuid,
        w: layoutItem.w,
        h: layoutItem.h,
        macros: getMacrosToTransfer()
      };

      activeCrossGridDrag = dragData;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    },
    [
      canExportCrossGridDrop,
      layout,
      props.id,
      props.embeddedDisplayUuid,
      getMacrosToTransfer
    ]
  );

  // End drag
  const handleCrossGridDragEnd = React.useCallback(() => {
    activeCrossGridDrag = null;
  }, []);

  // Wrap the child components in a div keyed by the child id. The key MUST map to the i field of Layout item for the component.
  const gridChildren = useMemo(
    () =>
      childrenArray.map(child => {
        const id = child.props.id;
        if (!id) {
          throw new Error("All grid items must have a stable id");
        }

        const activeId = dragState?.activeDrag?.i;
        const isActiveDragging = isInteracting && activeId === id;

        return (
          <div
            key={id}
            className="display-grid-layout-child"
            draggable={canExportCrossGridDrop}
            onDragStart={event => handleCrossGridDragStart(event, id)}
            onDragEnd={handleCrossGridDragEnd}
            style={{
              cursor: canExportCrossGridDrop
                ? "grab"
                : gridCellDragEnabled
                  ? "grab"
                  : "default"
            }}
          >
            {props.editable && (
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
            {isActiveDragging && (
              // overlay captures clicks during drag so child won't toggle
              <div
                data-testid="drag-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10,
                  background: "transparent"
                }}
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              />
            )}
          </div>
        );
      }),
    [
      childrenArray,
      canExportCrossGridDrop,
      gridCellDragEnabled,
      isInteracting,
      dragState,
      handleDelete,
      props.editable,
      handleCrossGridDragStart,
      handleCrossGridDragEnd
    ]
  );

  return (
    <MacroContext.Provider value={displayMacroContext}>
      <div style={extendedStyle} className="display-grid-layout-container">
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
          compactor={overlapCompactor}
          onDragStart={(layout, oldItem, newItem, placeholder, e, element) => {
            if (element?.style && gridCellDragEnabled)
              element.style.cursor = "grabbing";
            if (newItem) {
              hookOnDragStart(newItem.i, newItem.x, newItem.y);
            }
          }}
          onDragStop={(layout, _oldItem, newItem, _placeholder, e, element) => {
            if (element?.style && gridCellDragEnabled)
              element.style.cursor = "grab";
            if (newItem) {
              hookOnDragStop(newItem.i, newItem.x, newItem.y);
            }
            dispatch(
              displayInstanceUpdateGridLayout({
                embeddedDisplayUuid: props.embeddedDisplayUuid,
                gridDisplayId: props.id,
                gridLayout: layout
              })
            );
          }}
          // Enable dropping if grid is editable
          dropConfig={{
            enabled: canReceiveCrossGridDrop,
            defaultItem: {
              w: 1,
              h: 1
            },
            onDragOver: () => {
              const data = activeCrossGridDrag;

              if (!canReceiveCrossGridDrop || !data) return false;

              if (
                data.sourceGridId === props.id &&
                data.sourceEmbeddedDisplayUuid === props.embeddedDisplayUuid
              )
                return false;

              return {
                w: data.w,
                h: data.h
              };
            }
          }}
          // External dragging
          onDrop={(_newLayout, droppedItem, event) => {
            const data = activeCrossGridDrag;
            if (!data || !droppedItem) return;

            if (
              data.sourceGridId === props.id &&
              data.sourceEmbeddedDisplayUuid === props.embeddedDisplayUuid
            )
              return;

            dispatch(
              displayInstanceMoveWidgetBetweenGridLayouts({
                sourceEmbeddedDisplayUuid: data.sourceEmbeddedDisplayUuid,
                sourceGridId: data.sourceGridId,
                destinationEmbeddedDisplayUuid: props.embeddedDisplayUuid,
                destinationGridId: props.id,
                widgetId: data.widgetId,
                macros: getMacrosToTransfer(),
                destinationItem: {
                  x: droppedItem.x,
                  y: droppedItem.y,
                  w: droppedItem.w,
                  h: droppedItem.h
                }
              })
            );
            activeCrossGridDrag = null;
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onResizeStop={(layout, oldItem, newItem) => {
            if (newItem) {
              hookOnResizeStop(newItem.i, newItem.w, newItem.h);
            }
            dispatch(
              displayInstanceUpdateGridLayout({
                embeddedDisplayUuid: props.embeddedDisplayUuid,
                gridDisplayId: props.id,
                gridLayout: layout
              })
            );
          }}
          style={{
            ...style.colors,
            ...style.font,
            height: "100%"
          }}
        >
          {gridChildren}
        </ReactGridLayout>
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
