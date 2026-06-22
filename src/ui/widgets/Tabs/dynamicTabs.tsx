/**
 * A widget that shows files stored in the file context
 * under a specific 'location'.
 *
 * As the files are stored centrally, closing a tab in one such
 * widget will close it in other widgets showing the same location.
 *
 * See also the tab container widget and the dynamic page widget.
 */
import React, { useContext } from "react";

import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  StringOrNumPropOpt,
  BorderPropOpt,
  StringProp
} from "../propTypes";
import { EmbeddedDisplay } from "../EmbeddedDisplay/embeddedDisplay";
import { newRelativePosition } from "../../../types/position";

import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { TabBar } from "./tabs";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "dynamictabs";

export const DynamicTabsProps = {
  location: StringProp,
  maxHeight: StringOrNumPropOpt,
  maxWidth: StringOrNumPropOpt,
  minHeight: StringOrNumPropOpt,
  border: BorderPropOpt
};

type DynamicTabsComponentProps = InferWidgetProps<typeof DynamicTabsProps>;

export const DynamicTabsComponent = (
  props: DynamicTabsComponentProps
): JSX.Element => {
  const [{ border }, rawProps] = useStyle(props, widgetName);
  const newProps = rawProps as DynamicTabsComponentProps;

  const fileContext = useContext(FileContext);
  const tabState = fileContext.tabState[newProps.location];
  const containerStyle = {
    ...border,
    height: "100%",
    width: "100%",
    overflow: "auto",
    fontSize: "0.625rem"
  };
  if (!tabState || tabState.fileDetails.length === 0) {
    return (
      <div style={containerStyle}>
        <h3>Dynamic tabs &quot;{newProps.location}&quot;: no file loaded.</h3>
      </div>
    );
  } else {
    const openTabs = tabState.fileDetails;
    const selectedTab = tabState.selectedTab;

    const tabs = Object.values(openTabs).map(([name, description]) => {
      // Choose dimensions to avoid additional scroll bars appearing.
      return {
        name: name,
        children: (
          <EmbeddedDisplay
            position={newRelativePosition("99%", "96%")}
            file={{
              path: description?.path || "",
              defaultProtocol: description?.defaultProtocol ?? "ca",
              macros: description?.macros || {}
            }}
            key={name}
            scroll={true}
          />
        )
      };
    });

    const onTabSelected = (index: number): void => {
      fileContext.selectTab(newProps.location, index);
    };
    const onTabClosed = (index: number): void => {
      const [tabName, fileDesc] = openTabs[index];
      fileContext.removeTab(newProps.location, tabName, fileDesc);
    };
    const closeCurrentTab = (): void => {
      const [tabName, fileDesc] = openTabs[selectedTab];
      fileContext.removeTab(newProps.location, tabName, fileDesc);
    };

    return (
      <ExitFileContext.Provider value={() => closeCurrentTab()}>
        <div style={containerStyle}>
          <TabBar
            tabs={tabs}
            activeTab={selectedTab}
            onTabSelected={onTabSelected}
            onTabClosed={onTabClosed}
          ></TabBar>
        </div>
      </ExitFileContext.Provider>
    );
  }
};

export const DynamicTabsWidgetProps = {
  ...DynamicTabsProps,
  ...WidgetPropType
};

export const DynamicTabs = (
  props: InferWidgetProps<typeof DynamicTabsWidgetProps>
): JSX.Element => <Widget baseWidget={DynamicTabsComponent} {...props} />;

registerWidget(DynamicTabs, DynamicTabsProps, widgetName);
