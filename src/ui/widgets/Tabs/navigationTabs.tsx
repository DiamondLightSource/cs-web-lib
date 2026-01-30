/**
 * A widget that displays widgets in a number of pre-defined
 * tabs. This displays existing files via Embedded Displays
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
  BoolPropOpt,
  IntPropOpt,
  FontPropOpt
} from "../propTypes";

import { TabBar } from "./tabs";
import { Color, RelativePosition } from "../../../types";
import { EmbeddedDisplay } from "../EmbeddedDisplay/embeddedDisplay";

export const NavigationTabsProps = {
  tabs: PropTypes.array.isRequired,
  direction: IntPropOpt,
  visible: BoolPropOpt,
  tabWidth: IntPropOpt,
  tabHeight: IntPropOpt,
  tabSpacing: IntPropOpt,
  selectedColor: ColorPropOpt,
  deselectedColor: ColorPropOpt,
  font: FontPropOpt,
  activeTab: IntPropOpt
};

export const NavigationTabsComponent = (
  props: InferWidgetProps<typeof NavigationTabsProps>
): JSX.Element => {
  const tabChildren = useMemo(() => {
    return props.tabs.map(tab => {
      return {
        name: tab.name,
        children: (
          <EmbeddedDisplay
            height={"100%"}
            width={"100%"}
            position={new RelativePosition()}
            scroll={true}
            resize={0}
            file={{
              path: tab.file,
              macros: { ...tab.macros },
              defaultProtocol: tab.protocol ?? "ca"
            }}
          />
        )
      };
    });
  }, [props.tabs]);

  return (
    <TabBar
      direction={1}
      tabWidth={100}
      tabSpacing={2}
      selectedColor={Color.fromRgba(236, 236, 236)}
      deselectedColor={Color.fromRgba(200, 200, 200)}
      {...props}
      tabs={tabChildren}
    ></TabBar>
  );
};

export const NavigationTabsWidgetProps = {
  ...NavigationTabsProps,
  ...WidgetPropType
};

export const NavigationTabs = (
  props: InferWidgetProps<typeof NavigationTabsWidgetProps>
): JSX.Element => <Widget baseWidget={NavigationTabsComponent} {...props} />;

registerWidget(NavigationTabs, NavigationTabsProps, "navigationtabs");
