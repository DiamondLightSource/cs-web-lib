import React, { useContext } from "react";

import { Widget } from "../widget";
import { PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  ColorPropOpt,
  InferWidgetProps,
  StringArrayPropOpt,
  StringPropOpt,
  FontPropOpt,
  ActionsPropType,
  FuncPropOpt,
  DTypePropOpt
} from "../propTypes";
import { DType } from "../../../types/dtypes";
import {
  executeAction,
  getActionDescription,
  WidgetAction,
  WidgetActions,
  WritePv,
  WRITE_PV
} from "../widgetActions";
import { FileContext } from "../../../misc/fileContext";
import { Border } from "../../../types/border";
import { Color } from "../../../types/color";
import { MenuItem, Select } from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";
import { Font } from "../../../types";

export interface MenuButtonProps {
  connected: boolean;
  onChange: (action: WidgetAction) => void;
  pvName?: string;
  value?: DType;
  readonly: boolean;
  actionsFromPv?: boolean;
  itemsFromPv?: boolean;
  label?: string;
  actions?: WidgetActions;
  foregroundColor?: Color;
  backgroundColor?: Color;
  border?: Border;
  font?: Font;
  items?: string[];
  enabled?: boolean;
}

const MenuButtonComponentProps = {
  pvName: StringPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  enabled: BoolPropOpt,
  value: DTypePropOpt,
  actions: ActionsPropType,
  connected: BoolPropOpt,
  onChange: FuncPropOpt,
  // opi specific prop
  readonly: BoolPropOpt,
  actionsFromPv: BoolPropOpt,
  label: StringPropOpt,
  // bob specific prop
  items: StringArrayPropOpt,
  itemsFromPv: BoolPropOpt
};

export const MenuButtonComponent = (props: MenuButtonProps): JSX.Element => {
  const {
    connected,
    value = null,
    enabled = true,
    actionsFromPv = true,
    itemsFromPv = true,
    pvName,
    label,
    foregroundColor = diamondTheme.palette.primary.contrastText,
    backgroundColor = diamondTheme.palette.primary.main
  } = props;
  const fromPv = actionsFromPv && itemsFromPv;
  let actions: WidgetAction[] = props.actions?.actions ?? [];

  // Store whether component is disabled or not
  let disabled = !enabled;

  let options: string[] = label ? [label] : [];
  const displayOffset = label ? 1 : 0;

  // Using value to dictate displayed value as described here: https://reactjs.org/docs/forms.html#the-select-tag
  // Show 0 by default where there is only one option
  let displayIndex = 0;

  if (!(fromPv && pvName)) {
    options = options.concat(
      actions.map(action => {
        return getActionDescription(action);
      })
    );
  } else if (!connected || value === null) {
    disabled = true;
  } else if (value?.display?.choices) {
    options = options.concat(value?.display?.choices);
    actions = options.map((option, i) => {
      const writePv: WritePv = {
        type: WRITE_PV,
        writePvInfo: {
          pvName: pvName,
          value: i
        }
      };
      return writePv;
    });
    displayIndex = (value.getDoubleValue() ?? 0) + displayOffset;
  } else {
    disabled = true;
  }

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

  /* Don't disable the element itself because that prevents
     any interaction even for ancestor elements, including middle-click copy. */
  function onMouseDown(event: React.MouseEvent<HTMLDivElement>): void {
    if (disabled) {
      event.preventDefault();
    }
  }

  return (
    <Select
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
      onChange={event => {
        props.onChange(actions[parseInt(event.target.value) - displayOffset]);
      }}
      onMouseDown={event => onMouseDown(event)}
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

// Menu button which also knows how to write to a PV
export const SmartMenuButton = (props: MenuButtonProps): JSX.Element => {
  const files = useContext(FileContext);
  // Function to send the value on to the PV
  function onChange(action: WidgetAction): void {
    // The value from the select element is an integer as a string,
    // so we parse it into a float.
    executeAction(action, files);
  }

  return (
    <MenuButtonComponent
      pvName={props.pvName}
      connected={props.connected}
      value={props.value}
      readonly={props.readonly}
      actionsFromPv={props.actionsFromPv}
      itemsFromPv={props.itemsFromPv}
      actions={props.actions}
      onChange={onChange}
      label={props.label}
      foregroundColor={props.foregroundColor}
      backgroundColor={props.backgroundColor}
      items={props.items}
      font={props.font}
    />
  );
};

const MenuButtonWidgetProps = {
  ...MenuButtonComponentProps,
  ...PVWidgetPropType
};

export const MenuButton = (
  props: InferWidgetProps<typeof MenuButtonWidgetProps>
): JSX.Element => <Widget baseWidget={SmartMenuButton} {...props} />;

registerWidget(MenuButton, MenuButtonComponentProps, "menubutton");
