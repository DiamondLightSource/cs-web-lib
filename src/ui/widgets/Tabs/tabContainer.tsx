/**
 * A widget that displays widgets in a number of pre-defined
 * tabs.
 *
 * See also the dynamic tabs widget.
 */
import React, { useMemo } from "react";
import PropTypes from "prop-types";

import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  FontPropOpt,
  ChildrenPropOpt,
  StringPropOpt
} from "../propTypes";

import { TabBar } from "./tabs";
import { newRelativePosition } from "../../../types";
import { errorWidget, widgetDescriptionToComponent } from "../createComponent";
import log from "loglevel";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { newColor } from "../../../types/color";
import { useStyle } from "../../hooks/useStyle";
import { parseToPixelInt } from "../utils";

const widgetName = "tabcontainer";

export const TabContainerProps = {
  tabs: PropTypes.array.isRequired,
  backgroundColor: ColorPropOpt,
  activeTab: IntPropOpt,
  direction: IntPropOpt,
  tabHeight: IntPropOpt,
  font: FontPropOpt,
  children: ChildrenPropOpt,
  width: StringPropOpt,
  height: IntPropOpt
};

type TabContainerComponentProps = InferWidgetProps<typeof TabContainerProps> & {
  fileId: string;
  id: string;
  class?: string;
};

export const TabContainerComponent = (
  props: TabContainerComponentProps
): JSX.Element => {
  const [{ colors }, rawProps] = useStyle(props, widgetName, props.class);
  const newProps = rawProps as TabContainerComponentProps;
  const {
    tabHeight = 30,
    width = WIDGET_DEFAULT_SIZES["tabs"][0],
    height = WIDGET_DEFAULT_SIZES["tabs"][1]
  } = newProps;

  // Convert tabs into React components from widget descriptions
  const tabChildren = useMemo(() => {
    return newProps.tabs.map((tab, idx) => {
      try {
        const pixelWidth = parseToPixelInt(
          width,
          WIDGET_DEFAULT_SIZES["tabs"][0]
        );
        return {
          name: tab.name,
          children: widgetDescriptionToComponent({
            type: "display",
            id: newProps?.id ?? `tabContainer_${crypto.randomUUID()}`,
            fileId: newProps?.fileId,
            position: newRelativePosition(
              "0px",
              `${tabHeight}px`,
              `${pixelWidth}px`,
              `${height - tabHeight}px`
            ),
            backgroundColor: newColor(colors?.backgroundColor as string),
            children: tab.children
          })
        };
      } catch (e) {
        const message = `Error transforming children into components`;
        log.warn(message);
        log.warn(e);
        return {
          name: tab.name,
          children: widgetDescriptionToComponent(errorWidget(message), idx)
        };
      }
    });
  }, [
    newProps.tabs,
    colors?.backgroundColor,
    tabHeight,
    width,
    height,
    newProps.id,
    newProps.fileId
  ]);

  return (
    <TabBar
      direction={0}
      selectedColor={newColor(colors?.backgroundColor as string)}
      deselectedColor={newColor(colors?.backgroundColor as string)}
      {...newProps}
      tabs={tabChildren}
    ></TabBar>
  );
};

export const TabContainerWidgetProps = {
  ...TabContainerProps,
  ...WidgetPropType
};

export const TabContainer = (
  props: InferWidgetProps<typeof TabContainerWidgetProps>
): JSX.Element => <Widget baseWidget={TabContainerComponent} {...props} />;

registerWidget(TabContainer, TabContainerProps, widgetName);
