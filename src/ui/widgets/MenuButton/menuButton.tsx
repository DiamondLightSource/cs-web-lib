import React, { useContext, useEffect, useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  ColorPropOpt,
  InferWidgetProps,
  StringArrayPropOpt,
  FontPropOpt,
  BorderPropOpt,
  ActionsPropType
} from "../propTypes";
import {
  executeAction,
  WritePv,
  WRITE_PV,
  WidgetActions
} from "../widgetActions";
import { FileContext } from "../../../misc/fileContext";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { getPvValueAndName } from "../utils";
import log from "loglevel";
import { dTypeGetStringValue, dTypeGetType } from "../../../types/dtypes";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "menubutton";

export const MenuButtonProps = {
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  enabled: BoolPropOpt,
  // opi specific prop
  actionsFromPv: BoolPropOpt,
  actions: ActionsPropType,
  // bob specific prop
  items: StringArrayPropOpt,
  itemsFromPv: BoolPropOpt
};

export type MenuButtonComponentProps = InferWidgetProps<
  typeof MenuButtonProps
> &
  PVComponent;

export const MenuButtonComponent = (
  props: MenuButtonComponentProps
): JSX.Element => {
  const style = useStyle(
    { ...props, actions: props.actions as WidgetActions },
    widgetName
  );
  const files = useContext(FileContext);
  const {
    enabled = true,
    itemsFromPv = true,
    pvData,
    items = ["item 0"]
  } = props;

  let actions: any[] = props.actions?.actions ?? [];
  const {
    value,
    effectivePvName: pvName,
    connected
  } = getPvValueAndName(pvData);
  const valueType = dTypeGetType(value);
  const enumPv = value?.display.choices ? true : false;

  // Store whether component is disabled or not
  let disabled = !enabled;

  // Using value to dictate displayed value as described here: https://reactjs.org/docs/forms.html#the-select-tag
  // Show nothing by default where there is only one option, or warning of no PV
  const [displayValue, setDisplayValue] = useState(
    (dTypeGetStringValue(value) ?? pvName) ? "" : "No PV"
  );

  // If no value set at first, use blank label
  let options: string[] = value ? [] : pvName ? [""] : ["No PV"];

  // Disable PV if not connected, or if we requested options from PV and got none
  if ((pvName && !connected) || value === null) {
    disabled = true;
  }

  if (!itemsFromPv || !value?.display?.choices || !pvName) {
    // If items doesn't already contain the current value, add to list
    if (!items.includes(displayValue)) options = [displayValue];
    options = options.concat(items as string[]);
  } else {
    options = options.concat(value?.display?.choices);
  }

  if (pvName) {
    actions = options.map(option => {
      const writePv: WritePv = {
        type: WRITE_PV,
        writePvInfo: {
          pvName: pvName,
          value: valueType.isNumber ? Number(option) : option
        }
      };
      return writePv;
    });
  }

  useEffect(() => {
    if (value) {
      setDisplayValue(dTypeGetStringValue(value) ?? "");
    }
  }, [value]);

  const mappedOptions = options.map((text, index): JSX.Element => {
    return (
      <MenuItem
        key={index}
        value={text}
        sx={{ ...style?.font, ...style?.colors }}
      >
        {text}
      </MenuItem>
    );
  });

  function onChange(event: SelectChangeEvent): void {
    // Do nothing if we click on the first blank option
    if (event.target.value) {
      // If no PV connected, reset to No PV
      if (!pvName) {
        setDisplayValue("No PV");
      } else {
        // If PV connected, we allow the value to change and trigger index change
        try {
          executeAction(actions[options.indexOf(event.target.value)], files);
        } catch (e: any) {
          // If action fails due to widget items not existing on PV
          if (enumPv && !value?.display.choices?.includes(event.target.value)) {
            // Add an option to display our error string
            setDisplayValue(e.toString());
          } else {
            log.error(`Action failed: ${e}`);
          }
        }
      }
    }
  }

  return (
    <Select
      disabled={disabled}
      value={displayValue}
      MenuProps={{
        slotProps: {
          paper: {
            sx: style?.colors
          }
        }
      }}
      onChange={event => onChange(event)}
      sx={{
        ...style?.colors,
        cursor: disabled ? "not-allowed" : "default",
        height: "100%",
        width: "100%",
        textAlignLast: "center",
        "& .MuiSelect-select": {
          paddingLeft: "3px"
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderWidth: "1px",
          borderColor: style?.border?.borderColor
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderWidth: "2px",
          borderColor: style?.border?.borderColor
        },
        "& .MuiSelect-outlined": {
          ...style?.font,
          color: style?.colors?.color
        }
      }}
    >
      {mappedOptions}
    </Select>
  );
};

const MenuButtonWidgetProps = {
  ...MenuButtonProps,
  ...PVWidgetPropType
};

export const MenuButton = (
  props: InferWidgetProps<typeof MenuButtonWidgetProps>
): JSX.Element => <Widget baseWidget={MenuButtonComponent} {...props} />;

registerWidget(MenuButton, MenuButtonWidgetProps, widgetName);
