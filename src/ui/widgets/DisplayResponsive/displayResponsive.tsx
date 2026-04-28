import React, { useState, useContext, ReactNode } from "react";
import {
  Layout,
  ResponsiveLayouts,
  Responsive,
  useContainerWidth,
  Breakpoints
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

const widgetName = "displayResponsive";

// Default grid configuration
const defaultBreakpoints = { lg: 1200, md: 600, sm: 0 }; // These are minimum widths in pixels
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
  const { width, containerRef, mounted } = useContainerWidth();
  const inheritedMacros: MacroMap = useContext(MacroContext).macros;
  const [displayMacros, setDisplayMacros] = useState<MacroMap>(
    props.macros ?? {}
  );
  const displayMacroContext: MacroContextType = {
    updateMacro: (key: string, value: string): void => {
      setDisplayMacros({ ...displayMacros, [key]: value });
    },
    macros: {
      ...inheritedMacros, // lower priority
      ...displayMacros, // higher priority
      DID: props.id // highest priority
    }
  };

  // Get base style from common CSS
  const style = useStyle(props, widgetName);
  const extendedStyle: React.CSSProperties = {
    ...style.colors,
    ...style.border,
    ...style.other,
    ...style.font,
    position: "relative",
    overflow: props.overflow,
    height: "100%"
  };

  const cellMargins = (props.responsiveCellMargins ?? defaultMArgins) as [
    number,
    number
  ];

  const breakpoints = (props?.responsiveBreakpoints ??
    defaultBreakpoints) as Breakpoints<string>;
  const columns = (props.responsiveColumns ?? defaultCols) as Record<
    string,
    number
  >;

  const childrenArray = React.useMemo(
    () =>
      React.Children.toArray(props.children as ReactNode[]).filter(child =>
        React.isValidElement<PVWidgetComponent>(child)
      ),
    [props.children]
  );

  const layouts = React.useMemo(
    () =>
      props?.responsiveLayouts ??
      calculateDefaultLayouts(childrenArray, cellMargins),
    [props.responsiveLayouts, childrenArray, cellMargins]
  );

  // Wrap the child components in a div keyed by the child id. The key MUST map to the i field of Layout item for the component.
  const gridChildren = React.useMemo(
    () =>
      childrenArray.map(child => {
        const id = child.props.id;
        if (!id) {
          throw new Error("All grid items must have a stable id");
        }

        return <div key={id}>{child}</div>;
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
            className="layout"
            layouts={layouts}
            breakpoints={breakpoints}
            cols={columns}
            rowHeight={Number(props.rowHeight ?? defaultRowHeight)}
            margin={cellMargins}
            width={width}
            resizeConfig={{ enabled: false }}
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

// This is a temporary function to calculate breakpoints if none are specified.
// Note that width in columns and height should be defined by the parent not the child in RGL,
// so this will need to change when we implement child resizing.
const calculateDefaultLayouts = (
  childrenArray: React.ReactElement<
    PVWidgetComponent,
    string | React.JSXElementConstructor<any>
  >[],
  cellMargins: [number, number]
): ResponsiveLayouts => {
  const gridMetadata = childrenArray.map(child => {
    const width = child?.props?.position?.width
      ? Math.ceil(
          (Number(child?.props?.position?.width?.replace(/px$/, "")) +
            cellMargins[0]) /
            (40 + cellMargins[0])
        )
      : 1;
    const height = child?.props?.position?.height
      ? Math.ceil(
          (Number(child?.props?.position?.height?.replace(/px$/, "")) +
            cellMargins[1]) /
            (defaultRowHeight + cellMargins[1])
        )
      : 1;
    const id = child.props.id;

    return { width, height, id };
  });

  return {
    lg: gridMetadata?.map((child, i) => ({
      i: child?.id,
      x: (i % 3) * 4,
      y: Math.floor(i / 3),
      w: child?.width,
      h: child?.height
    })) as Layout,
    md: gridMetadata?.map((child, i) => ({
      i: child?.id,
      x: (i % 2) * 5,
      y: Math.floor(i / 2),
      w: child?.width,
      h: child?.height
    })) as Layout,
    sm: gridMetadata?.map((child, i) => ({
      i: child?.id,
      x: 0,
      y: i,
      w: child?.width,
      h: child?.height
    })) as Layout
  };
};

export const DisplayResponsive = (
  props: InferWidgetProps<typeof DisplayResponsiveWidgetProps>
): JSX.Element => <Widget baseWidget={DisplayResponsiveComponent} {...props} />;

registerWidget(DisplayResponsive, DisplayResponsiveWidgetProps, widgetName);
