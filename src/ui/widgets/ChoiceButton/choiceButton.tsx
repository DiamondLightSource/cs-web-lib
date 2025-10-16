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
import { writePv } from "../../hooks/useSubscription";
import {
  ToggleButton as MuiToggleButton,
  styled,
  ToggleButtonGroup,
  useTheme
} from "@mui/material";
import { Color } from "../../../types";
import { getPvValueAndName } from "../utils";

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
    display: "block",
    padding: 0,
    lineHeight: 1,
    alignItems: "center",
    justifyContent: "center",
    textOverflow: "clip",
    wordWrap: "break-word"
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  },
  "&.MuiToggleButtonGroup-grouped": {
    border: "1px solid !important",
    borderColor: "#000000"
  }
});

export const ChoiceButtonComponent = (
  props: ChoiceButtonComponentProps
): JSX.Element => {
  const theme = useTheme();
  const {
    width = 100,
    height = 43,
    pvData,
    enabled = true,
    itemsFromPv = true,
    items = ["Item 1", "Item 2"],
    horizontal = true,
    foregroundColor = theme.palette.primary.contrastText,
    backgroundColor = theme.palette.primary.main,
    selectedColor = Color.fromRgba(200, 200, 200)
  } = props;
  const { value, effectivePvName: pvName } = getPvValueAndName(pvData);

  const font = props.font?.css() ?? theme.typography;
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
        display: "flex",
        height: "100%",
        width: "100%"
      }}
    >
      {options
        .filter(item => typeof item === "string")
        .map((item, idx) => (
          <ToggleButton
            key={item}
            value={idx}
            sx={{
              width: buttonWidth,
              height: buttonHeight,
              fontFamily: font,
              color: foregroundColor.toString(),
              backgroundColor: backgroundColor.toString(),
              "&.Mui-selected": {
                backgroundColor: selectedColor.toString()
              },
              "&.Mui-selected:hover": {
                backgroundColor: selectedColor.toString(),
                opacity: 0.6
              },
              "&:hover": {
                backgroundColor: backgroundColor.toString(),
                opacity: 0.6
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
