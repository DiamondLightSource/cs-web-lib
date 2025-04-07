import React, { useEffect, useState } from "react";

import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  ColorPropOpt,
  FontPropOpt,
  InferWidgetProps,
  IntPropOpt,
  StringArrayPropOpt,
  StringPropOpt
} from "../propTypes";
import { DType } from "../../../types/dtypes";
// import classes from "./choiceButton.module.css";
import { writePv } from "../../hooks/useSubscription";
import {
  ToggleButton as MuiToggleButton,
  styled,
  ToggleButtonGroup
} from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";
import { Color } from "../../../types";

const ChoiceButtonProps = {
  pvName: StringPropOpt,
  height: IntPropOpt,
  width: IntPropOpt,
  items: StringArrayPropOpt,
  selectedColor: ColorPropOpt,
  itemsFromPv: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  horizontal: BoolPropOpt,
  enabled: BoolPropOpt,
  itemsfromPv: BoolPropOpt,
  font: FontPropOpt
};

export type ChoiceButtonComponentProps = InferWidgetProps<
  typeof ChoiceButtonProps
> &
  PVComponent;

const ToggleButton = styled(MuiToggleButton)({
  "&.MuiToggleButton-root": {
    textTransform: "none",
    overflow: "hidden",
    padding: 0,
    lineHeight: 1
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  }
});

export const ChoiceButtonComponent = (
  props: ChoiceButtonComponentProps
): JSX.Element => {
  const {
    width = 100,
    height = 43,
    value = null,
    enabled = true,
    itemsFromPv = true,
    pvName,
    items = ["Item 1", "Item 2"],
    horizontal = true,
    foregroundColor = diamondTheme.palette.primary.contrastText,
    backgroundColor = diamondTheme.palette.primary.main,
    selectedColor = Color.fromRgba(200, 200, 200)
  } = props;
  const font = props.font?.css() ?? diamondTheme.typography;
  const [selected, setSelected] = useState(value?.getDoubleValue());

  // Use items from file, unless itemsFRomPv set
  let options = items;
  if (itemsFromPv && value?.display.choices) options = value?.display.choices;

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (value) {
      setSelected(value.getDoubleValue());
    }
  }, [value]);

  // Number of buttons to create
  const numButtons = options.length || 1;
  // Determine width and height of buttons if horizontal or vertically placed
  const buttonHeight = horizontal ? height : height / numButtons;
  const buttonWidth = horizontal ? width / numButtons : width;

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newSelect: number
  ) => {
    // Write to PV
    if (pvName) {
      writePv(pvName, new DType({ doubleValue: newSelect }));
    }
    setSelected(newSelect);
  };

  return (
    <ToggleButtonGroup
      exclusive
      fullWidth={true}
      disabled={!enabled}
      value={selected}
      onChange={handleChange}
      orientation={horizontal ? "horizontal" : "vertical"}
      sx={{
        height: height,
        width: width
      }}
    >
      {options
        .filter(item => typeof item === "string")
        .map((item, idx) => (
          <ToggleButton
            key={item}
            value={idx}
            sx={{
              minWidth: buttonWidth,
              minHeight: buttonHeight,
              fontFamily: font,
              color: foregroundColor.toString(),
              backgroundColor: backgroundColor.toString(),
              "&.Mui-selected, &.Mui-selected:hover, &:hover": {
                backgroundColor: selectedColor.toString()
              }
            }}
          >
            {item}
          </ToggleButton>
        ))}
    </ToggleButtonGroup>
  );
};

const ChoiceButtonWidgetProps = {
  ...ChoiceButtonProps,
  ...PVWidgetPropType
};

export const ChoiceButton = (
  props: InferWidgetProps<typeof ChoiceButtonWidgetProps>
): JSX.Element => <Widget baseWidget={ChoiceButtonComponent} {...props} />;

registerWidget(ChoiceButton, ChoiceButtonWidgetProps, "choicebutton");
