import React, { useState } from "react";
import {
  Box,
  IconButton,
  Tab as MuiTab,
  Paper,
  styled,
  Tabs,
  useTheme
} from "@mui/material";
import { Color, Font } from "../../../types";
import { Close } from "@mui/icons-material";
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
  },
  "&.Mui-selected": {
    "&:hover": {
      opacity: 1
    }
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

  const font =
    props.font ??
    new Font(theme.typography.fontSize, undefined, theme.typography.fontFamily);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const element = event.target as HTMLElement;
    if (element.tagName === "path") {
      event.preventDefault();
      return;
    }
    // If a handler function is passed in, do that instead
    props.onTabSelected ? props.onTabSelected(newValue) : setValue(newValue);
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
          minHeight: direction ? "100%" : tabHeight,
          minWidth: direction ? tabWidth : "100%",
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
              // Close tab on middle click if on provided in props
              onMouseDown={(e: React.MouseEvent): void => {
                if (e.button === 1 && props.onTabClosed) {
                  props.onTabClosed(index);
                }
              }}
              label={
                <span>
                  {tab.name}
                  {props.onTabClosed ? (
                    <IconButton
                      size="small"
                      component="span"
                      onClick={props.onTabClosed(index)}
                    >
                      <Close />
                    </IconButton>
                  ) : (
                    <></>
                  )}
                </span>
              }
              sx={{
                "&.Mui-selected": {
                  backgroundColor: selectedColor.toString(),
                  color: "black"
                },
                boxShadow: 3,
                backgroundColor: deselectedColor.toString(),
                marginRight: direction ? "0px" : `${tabSpacing}px`,
                marginBottom: direction ? `${tabSpacing}px` : "0px",
                "&.MuiTab-root": {
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
          <Paper
            elevation={3}
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            key={`${tab.name}${index}`}
            aria-labelledby={`simple-tab-${index}`}
            sx={{
              display: "flex",
              overflowY: "scroll"
            }}
          >
            {value === index && <>{tab.children}</>}
          </Paper>
        )
      )}
    </Box>
  );
};
