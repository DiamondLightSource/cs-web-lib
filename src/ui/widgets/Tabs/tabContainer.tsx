/**
 * A widget that displays widgets in a number of pre-defined
 * tabs.
 *
 * See also the dynamic tabs widget.
 */
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import log from "loglevel";

import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  FontPropOpt,
  ChildrenPropOpt
} from "../propTypes";

import { TabBar } from "./tabs";
import { Color, RelativePosition } from "../../../types";
import { widgetDescriptionToComponent } from "../createComponent";

export const TabContainerProps = {
  tabs: PropTypes.array.isRequired,
  backgroundColor: ColorPropOpt,
  activeTab: IntPropOpt,
  direction: IntPropOpt,
  tabHeight: IntPropOpt,
  font: FontPropOpt,
  children: ChildrenPropOpt
};

export const TabContainerComponent = (
  props: InferWidgetProps<typeof TabContainerProps>
): JSX.Element => {

  // Convert tabs into React components from widget descriptions
  const tabChildren = useMemo(() => {
    return props.tabs.map((tab) => {
       return {
        name: tab.name,
        children: widgetDescriptionToComponent({
          type: "display",
          position: new RelativePosition(),
          backgroundColor:
            props.backgroundColor ?? new Color("rgb(255,255,255"),
          children: tab.children,
        })
    }});
  }, [props.tabs]);

  return (
    <div>
      <TabBar
        direction={0}
        selectedColor={props.backgroundColor || Color.fromRgba(255, 255, 255)}
        deselectedColor={props.backgroundColor || Color.fromRgba(255, 255, 255)}
        {...props}
        tabs={tabChildren}
      ></TabBar>
    </div>
  );
};

export const TabContainerWidgetProps = {
  ...TabContainerProps,
  ...WidgetPropType
};

export const TabContainer = (
  props: InferWidgetProps<typeof TabContainerWidgetProps>
): JSX.Element => <Widget baseWidget={TabContainerComponent} {...props} />;

registerWidget(TabContainer, TabContainerProps, "tabcontainer");
