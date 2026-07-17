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
import {
  Autocomplete,
  createFilterOptions,
  MenuItem,
  Select,
  TextField
} from "@mui/material";
import { getPvValueAndName } from "../utils";
import log from "loglevel";
import {
  dTypeGetStringValue,
  dTypeGetType,
  DtypeValues
} from "../../../types/dtypes";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "menubutton";

export const MenuButtonProps = {
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  enabled: BoolPropOpt,
  editable: BoolPropOpt,
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
  const [style, rawProps] = useStyle(
    { ...props, actions: props.actions as WidgetActions },
    widgetName,
    props.class
  );
  const newProps = rawProps as MenuButtonComponentProps;
  const files = useContext(FileContext);
  const {
    enabled = true,
    itemsFromPv = true,
    pvData,
    items = ["item 0"]
  } = newProps;

  let actions: any[] = newProps.actions?.actions ?? [];
  const {
    value,
    effectivePvName: pvName,
    connected,
    readOnly
  } = getPvValueAndName(pvData);
  const enumPv = value?.display.choices ? true : false;

  // Store whether component is disabled or not
  let disabled = readOnly || !enabled;

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

  const valueType = dTypeGetType(value);
  if (pvName) {
    actions = options.map(option => {
      const writePv: WritePv = {
        type: WRITE_PV,
        writePvInfo: {
          pvName: pvName,
          value: valueType === DtypeValues.NUMBER ? Number(option) : option
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

  function onChange(newValue: string | null): void {
    // Do nothing if we click on the first blank option
    if (newValue) {
      // If no PV connected, reset to No PV
      if (!pvName) {
        setDisplayValue("No PV");
      } else {
        // If PV connected, we allow the value to change and trigger index change
        try {
          if (options.includes(newValue)) {
            executeAction(actions[options.indexOf(newValue)], files);
          } else {
            executeAction(
              {
                type: WRITE_PV,
                writePvInfo: {
                  pvName: pvName,
                  value:
                    valueType === DtypeValues.NUMBER
                      ? Number(newValue)
                      : newValue
                }
              } as WritePv,
              files
            );
          }
        } catch (e: any) {
          // If action fails due to widget items not existing on PV
          if (enumPv && !value?.display.choices?.includes(newValue)) {
            // Add an option to display our error string
            setDisplayValue(e.toString());
          } else {
            log.error(`Action failed: ${e}`);
          }
        }
      }
    }
  }

  const filter = createFilterOptions<string>();

  return props.editable ? (
    <Autocomplete
      value={displayValue}
      onChange={(_, newValue) => onChange(newValue)}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      freeSolo
      options={options}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        const isExisting = options.some(option => inputValue === option);
        if (inputValue !== "" && !isExisting) {
          filtered.push(inputValue);
        }
        return filtered;
      }}
      renderInput={params => <TextField {...params} />}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps} style={{ ...style?.colors }}>
            {option}
          </li>
        );
      }}
      slotProps={{
        paper: {
          sx: { ...style?.colors }
        }
      }}
      sx={{
        cursor: disabled ? "not-allowed" : "default",
        height: "100%",
        width: "100%",
        "& .MuiFormControl-root": {
          height: "100%",
          width: "100%"
        },
        "& .MuiInputBase-root": {
          ...style?.colors,
          height: "100%",
          widht: "100%"
        },
        "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
          borderRadius: "4px",
          inset: "0px",
          "& .css-1nf2c5d-MuiNotchedOutlined-root": {
            height: "0px"
          }
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "#000000"
          }
      }}
    />
  ) : (
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
      onChange={event => onChange(event.target.value)}
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
