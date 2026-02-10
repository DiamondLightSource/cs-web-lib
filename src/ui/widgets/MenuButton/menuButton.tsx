import React, { useContext, useEffect, useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  ColorPropOpt,
  InferWidgetProps,
  StringArrayPropOpt,
  StringPropOpt,
  FontPropOpt,
  BorderPropOpt,
  ActionsPropType
} from "../propTypes";
import { executeAction, WritePv, WRITE_PV } from "../widgetActions";
import { FileContext } from "../../../misc/fileContext";
import { MenuItem, Select, SelectChangeEvent, useTheme } from "@mui/material";
import { getPvValueAndName } from "../utils";
import log from "loglevel";
import { dTypeGetStringValue } from "../../../types/dtypes/dType";

export const MenuButtonProps = {
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  enabled: BoolPropOpt,
  // opi specific prop
  actionsFromPv: BoolPropOpt,
  actions: ActionsPropType,
  label: StringPropOpt,
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
  const theme = useTheme();
  const {
    enabled = true,
    actionsFromPv = true,
    itemsFromPv = true,
    pvData,
    label,
    items = ["Item 1", "Item 2"]
  } = props;
  const foregroundColor =
    props.foregroundColor?.colorString ?? theme.palette.primary.contrastText;
  const backgroundColor =
    props.backgroundColor?.colorString ?? theme.palette.primary.main;
  const files = useContext(FileContext);
  const fromPv = actionsFromPv && itemsFromPv;
  let actions: any[] = props.actions?.actions ?? [];
  const {
    value,
    effectivePvName: pvName,
    connected
  } = getPvValueAndName(pvData);
  const enumPv = value?.display.choices ? true : false;

  // Store whether component is disabled or not
  let disabled = !enabled;

  // If no value set at first, use blank label
  let options: string[] = label ? [label] : pvName ? [] : ["No PV"];

  // Using value to dictate displayed value as described here: https://reactjs.org/docs/forms.html#the-select-tag
  // Show nothing by default where there is only one option, or warning of no PV
  const [displayValue, setDisplayValue] = useState(
    (dTypeGetStringValue(value) ?? pvName) ? "" : "No PV"
  );

  // Disable PV if not connected, or if we requested options from PV and got none
  if (
    (pvName && !connected) ||
    value === null ||
    (value?.display.choices === undefined && fromPv)
  ) {
    disabled = true;
  }

  if (!itemsFromPv || !value?.display?.choices || !pvName) {
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
          value: option
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
        sx={{
          fontFamily: props.font?.css() ?? "",
          color: foregroundColor
        }}
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
            sx: {
              backgroundColor: backgroundColor
            }
          }
        }
      }}
      onChange={event => onChange(event)}
      sx={{
        cursor: disabled ? "not-allowed" : "default",
        height: "100%",
        width: "100%",
        textAlignLast: "center",
        backgroundColor: backgroundColor,
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderWidth: "1px",
          borderColor: "#1976d2"
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderWidth: "2px",
          borderColor: "#1976d2"
        },
        "& .MuiSelect-outlined": {
          fontFamily: props.font?.css() ?? "",
          color: foregroundColor
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

registerWidget(MenuButton, MenuButtonWidgetProps, "menubutton");
