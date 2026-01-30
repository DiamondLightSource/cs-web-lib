import React, { useState } from "react";
import { Box, Tab as MuiTab, styled, Tabs, useTheme } from "@mui/material";
import { Color, Font, RelativePosition } from "../../../types";
import PropTypes from "prop-types";
import {
  ColorPropOpt,
  BoolPropOpt,
  IntPropOpt,
  FontPropOpt,
  FuncPropOpt,
  InferWidgetProps
} from "../propTypes";

const Tab = styled(MuiTab)({
  padding: 0,
  lineHeight: 1.3,
  "&.MuiTab-root": {
    padding: 0
  },
  "&:hover": {
    opacity: 0.5
  }
});

export const TabBarProps = {
  tabs: PropTypes.array.isRequired,
  onTabSelected: FuncPropOpt,
  onTabClosed: FuncPropOpt,
  direction: IntPropOpt,
  tabWidth: IntPropOpt,
  tabHeight: IntPropOpt,
  tabSpacing: IntPropOpt,
  selectedColor: ColorPropOpt,
  deselectedColor: ColorPropOpt,
  font: FontPropOpt,
  activeTab: IntPropOpt,
  visible: BoolPropOpt
};

export const TabBar = (
  props: InferWidgetProps<typeof TabBarProps>
): JSX.Element => {
  const theme = useTheme();
  const {
    direction = 0,
    tabWidth = 100,
    tabHeight = 30,
    tabSpacing = 0,
    selectedColor = Color.fromRgba(236, 236, 236),
    deselectedColor = Color.fromRgba(200, 200, 200),
    activeTab = 0,
    visible = true
  } = props;
  const [value, setValue] = useState(activeTab);
  console.log(props.tabs);

  const font =
    props.font ??
    new Font(theme.typography.fontSize, undefined, theme.typography.fontFamily);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const element = event.target as HTMLElement;
    if (element.tagName === "path") {
      event.preventDefault();
      return;
    }
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        display: "flex",
        visibility: visible ? "visible" : "hidden",
        flexDirection: direction ? "row" : "column",
        width: "100%",
        height: "100%",
        flexGrow: 1
      }}
    >
      <Tabs
        sx={{
          width: direction ? tabWidth : "100%",
          height: direction ? "100%" : tabHeight,
          display: "flex",
          font: font.css(),
          "& .MuiTabs-indicator": {
            backgroundColor: "transparent"
          }
        }}
        value={value}
        onChange={handleChange}
        orientation={direction ? "vertical" : "horizontal"}
      >
        {props.tabs.map(
          (tab, index): JSX.Element => (
            <Tab
              key={index}
              label={tab.name}
              sx={{
                color: "black",
                "&.Mui-selected": {
                  backgroundColor: selectedColor.toString(),
                  color: "black"
                },
                backgroundColor: deselectedColor.toString(),
                marginRight: direction ? "0px" : `${tabSpacing}px`,
                marginBottom: direction ? `${tabSpacing}px` : "0px",
                "&.MuiTab-root": {
                  width: tabWidth,
                  height: tabHeight,
                  minWidth: tabWidth,
                  minHeight: tabHeight
                }
              }}
            ></Tab>
          )
        )}
      </Tabs>
      {props.tabs.map(
        (tab, index): JSX.Element => (
          <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            key={`${tab.name}${index}`}
            aria-labelledby={`simple-tab-${index}`}
            style={{
              height: direction ? "100%" : `calc(100% - ${tabHeight}px)`,
              overflowY: "scroll",
              width: direction ? `calc(100% - ${tabWidth}px)` : "100%"
            }}
          >
            {value === index && <>{tab.children}</>}
          </div>
        )
      )}
    </Box>
  );
};
