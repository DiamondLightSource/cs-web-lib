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
import {
  dTypeGetDoubleValue,
  dTypeGetStringValue,
  dTypeGetType,
  DtypeValues,
  newDType
} from "../../../types/dtypes";
import { writePv } from "../../hooks/useSubscription";
import {
  ToggleButton as MuiToggleButton,
  styled,
  ToggleButtonGroup
} from "@mui/material";
import { getPvValueAndName } from "../utils";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "choicebutton";

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
    display: "flex",
    padding: 0,
    lineHeight: 1.2,
    alignItems: "center",
    justifyContent: "center",
    textOverflow: "clip",
    wordWrap: "break-word"
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important",
    opacity: 0.7
  },
  "&.MuiToggleButtonGroup-grouped": {
    border: "1px solid !important",
    borderColor: "#000000"
  }
});

export const ChoiceButtonComponent = (
  props: ChoiceButtonComponentProps
): JSX.Element => {
  const style = useStyle(
    { ...props, customColors: { selectedColor: props?.selectedColor } },
    widgetName
  );
  const {
    width = 100,
    height = 43,
    pvData,
    enabled = true,
    itemsFromPv = true,
    items = ["Item 1", "Item 2"],
    horizontal = true
  } = props;
  const {
    value,
    effectivePvName: pvName,
    readOnly
  } = getPvValueAndName(pvData);

  const valueType = dTypeGetType(value);
  const [selected, setSelected] = useState(
    value
      ? valueType === DtypeValues.NUMBER
        ? dTypeGetDoubleValue(value)
        : dTypeGetStringValue(value)
      : value
  );

  // Use items from file, unless itemsFromPv set
  let options = items;
  if (itemsFromPv && value?.display.choices) options = value?.display.choices;

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (value) {
      setSelected(
        valueType === DtypeValues.NUMBER
          ? dTypeGetDoubleValue(value)
          : dTypeGetStringValue(value)
      );
    }
  }, [value, valueType]);

  // Number of buttons to create
  const numButtons = options.length || 1;
  // Determine width and height of buttons if horizontal or vertically placed
  const buttonHeight = horizontal ? height : height / numButtons;
  const buttonWidth = horizontal ? width / numButtons : width;

  const handleChange = (event: any, newSelect: number) => {
    // Write to PV
    if (pvName && readOnly)
      writePv(
        pvName,
        newDType(
          valueType === DtypeValues.STRING || value?.display.choices
            ? { stringValue: event.target.innerText }
            : { doubleValue: newSelect }
        )
      );
  };

  return (
    <ToggleButtonGroup
      exclusive
      fullWidth={true}
      disabled={readOnly || !enabled}
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
              cursor: readOnly ? "not-allowed" : "default",
              ...style.font,
              ...style.colors,
              width: buttonWidth,
              height: buttonHeight,
              "&.Mui-selected": {
                backgroundColor: style?.customColors?.selectedColor
              },
              "&.Mui-selected:hover": {
                backgroundColor: style?.customColors?.selectedColor,
                opacity: 0.6
              },
              "&:hover": {
                backgroundColor: style.colors.backgroundColor,
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

registerWidget(ChoiceButton, ChoiceButtonWidgetProps, widgetName);
