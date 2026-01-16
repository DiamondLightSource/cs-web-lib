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
import {
  executeAction,
  WidgetAction,
  WritePv,
  WRITE_PV
} from "../widgetActions";
import { FileContext } from "../../../misc/fileContext";
import { MenuItem, Select, SelectChangeEvent, useTheme } from "@mui/material";
import { getPvValueAndName } from "../utils";

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
    foregroundColor = theme.palette.primary.contrastText,
    backgroundColor = theme.palette.primary.main,
    items = ["Item 1", "Item 2"]
  } = props;
  const files = useContext(FileContext);
  const fromPv = actionsFromPv && itemsFromPv;
  let actions: any[] = props.actions?.actions ?? [];
  const {
    value,
    effectivePvName: pvName,
    connected
  } = getPvValueAndName(pvData);

  // Store whether component is disabled or not
  let disabled = !enabled;

  let options: string[] = label ? [label] : [""];
  const displayOffset = 1;

  // Using value to dictate displayed value as described here: https://reactjs.org/docs/forms.html#the-select-tag
  // Show 0 by default where there is only one option
  const [displayIndex, setDisplayIndex] = useState(0);

  // Disable PV if not connected, or if we requested options from PV and got none
  if (
    !connected ||
    value === null ||
    (value?.display.choices === undefined && fromPv)
  ) {
    disabled = true;
  }

  if (!fromPv || !value?.display?.choices || !pvName) {
    options = options.concat(items as string[]);
  } else {
    options = options.concat(value?.display?.choices);
  }

  const allowedIndices: number[] = [];
  // If not items from PV but PV still has items
  if (!fromPv && value?.display.choices) {
    // Compare the two lists and find allowed values
    items.forEach((item, idx) => {
      if (value.display.choices?.find(x => x === item))
        allowedIndices.push(idx);
    });
  }

  if (pvName) {
    actions = options.map((option, i) => {
      if (!i) return;
      const writePv: WritePv = {
        type: WRITE_PV,
        writePvInfo: {
          pvName: pvName,
          value: i
        }
      };
      return writePv;
    });
  }

  useEffect(() => {
    if (value) {
      setDisplayIndex((value.getDoubleValue() ?? -1) + displayOffset);
    }
  }, [value, displayOffset]);

  const mappedOptions = options.map((text, index): JSX.Element => {
    return (
      <MenuItem
        key={index}
        value={index}
        sx={{
          fontFamily: props.font?.css() ?? "",
          color: foregroundColor.toString()
        }}
      >
        {text}
      </MenuItem>
    );
  });

  function onChange(event: SelectChangeEvent): void {
    // Do nothing if we click on the first blank option
    if (event.target.value) {
      // If no PV connected, manually change index
      if (!pvName) {
        setDisplayIndex(parseFloat(event.target.value));
      } else {
        // If PV connected, we allow the value to change and trigger index change
        try {
          executeAction(
            actions[parseFloat(event.target.value) - displayOffset],
            files
          );
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  return (
    <Select
      disabled={disabled}
      value={displayIndex.toString()}
      MenuProps={{
        slotProps: {
          paper: {
            sx: {
              backgroundColor: backgroundColor.toString()
            }
          }
        }
      }}
      renderValue={value => {
        return options[displayIndex];
      }}
      onChange={event => onChange(event)}
      sx={{
        cursor: disabled ? "not-allowed" : "default",
        height: "100%",
        width: "100%",
        textAlignLast: "center",
        backgroundColor: backgroundColor.toString(),
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
          color: foregroundColor.toString()
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
