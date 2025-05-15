import React, { useEffect, useState } from "react";

import { writePv } from "../../hooks/useSubscription";
import { Widget } from "../widget";
import { PVInputComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  FontPropOpt,
  ChoicePropOpt,
  ColorPropOpt,
  BoolPropOpt,
  BorderPropOpt,
  StringPropOpt,
  FloatPropOpt
} from "../propTypes";
import { AlarmQuality, DType } from "../../../types/dtypes";
import { TextField as MuiTextField, styled, useTheme } from "@mui/material";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

const InputComponentProps = {
  pvName: StringPropOpt,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  transparent: BoolPropOpt,
  alarmSensitive: BoolPropOpt,
  enabled: BoolPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"]),
  textAlignV: ChoicePropOpt(["top", "center", "bottom"]),
  border: BorderPropOpt,
  multiLine: BoolPropOpt,
  height: FloatPropOpt
};

const TextField = styled(MuiTextField)({
  // MUI Textfield contains a fieldset with a legend that needs to be removed
  "& .css-w4cd9x": {
    lineHeight: "0px"
  },
  "&.MuiFormControl-root": {
    height: "100%",
    width: "100%",
    display: "flex"
  },
  "& .MuiInputBase-root": {
    height: "100%",
    width: "100%",
    padding: "0px 4px"
  },
  "& .MuiInputBase-input": {
    padding: "0px",
    lineHeight: 1,
    textOverflow: "ellipsis",
    whiteSpace: "pre-wrap",
    height: "100%",
    width: "100%"
  },
  "& .MuiOutlinedInput-root": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderRadius: "4px",
      borderWidth: "0px",
      inset: "0px"
    },
    "&.Mui-disabled": {
      cursor: "not-allowed",
      pointerEvents: "all !important"
    }
  }
});

export const SmartInputComponent = (
  props: PVInputComponent & InferWidgetProps<typeof InputComponentProps>
): JSX.Element => {
  const theme = useTheme();
  const {
    enabled = true,
    transparent = false,
    textAlign = "left",
    textAlignV = "center",
    value = null,
    multiLine = false,
    alarmSensitive = true,
    height = WIDGET_DEFAULT_SIZES["textupdate"][1]
  } = props;

  const font = props.font?.css() ?? theme.typography;

  let foregroundColor =
    props.foregroundColor?.toString() ?? theme.palette.primary.contrastText;

  let borderColor = props.border?.css().borderColor ?? "#000000";
  let borderStyle = props.border?.css().borderStyle ?? "solid";
  let borderWidth = props.border?.width ?? "0px";

  const alarmQuality = props.value?.getAlarm().quality ?? AlarmQuality.VALID;
  if (alarmSensitive) {
    switch (alarmQuality) {
      case AlarmQuality.UNDEFINED:
      case AlarmQuality.INVALID:
      case AlarmQuality.CHANGING:
        foregroundColor = "var(--invalid)";
        borderColor = "var(--invalid)";
        borderStyle = "solid";
        borderWidth = "1px";
        break;
      case AlarmQuality.ALARM:
      case AlarmQuality.WARNING:
        foregroundColor = "var(--alarm)";
        borderColor = "var(--alarm)";
        borderStyle = "solid";
        borderWidth = "2px";
        break;
      default:
        break;
    }
  }

  let alignmentV = "center";
  if (textAlignV === "top") {
    alignmentV = "start";
  } else if (textAlignV === "bottom") {
    alignmentV = "end";
  }

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? "#80FFFF");

  // If props.font exists, extracts the font size in rem and returns is back to size in px
  // using the default browser size of 16px, as used in ../../../types/font.ts
  const fontSize = props.font?.css().fontSize
    ? parseFloat(
        props.font
          .css()
          .fontSize?.toString()
          .match(/\d+.\d+/)
          ?.toString() ?? ""
      ) * 16
    : theme.typography.fontSize;

  const maxRows = multiLine
    ? Math.floor(height / fontSize) - 1 < 1
      ? 1
      : Math.floor(height / fontSize) - 1
    : 1;

  const [inputValue, setInputValue] = useState(value?.getStringValue() ?? "");

  useEffect(() => {
    if (value) {
      setInputValue(value.getStringValue() ?? "");
    }
  }, [value]);

  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (multiLine) {
      if (event.key === "Enter" && event.ctrlKey) {
        writePv(props.pvName, new DType({ stringValue: inputValue }));
        event.currentTarget.blur();
      }
    } else {
      if (event.key === "Enter") {
        writePv(props.pvName, new DType({ stringValue: inputValue }));
        event.currentTarget.blur();
      }
    }
  };

  return (
    <TextField
      disabled={!enabled}
      value={inputValue}
      maxRows={maxRows}
      multiline={multiLine}
      variant="outlined"
      type="text"
      slotProps={{
        input: {
          onKeyDown: onKeyPress
        }
      }}
      onChange={event => setInputValue(event.target.value)}
      sx={{
        "& .MuiInputBase-input": {
          textAlign: textAlign,
          font: font
        },
        "& .MuiInputBase-root": {
          alignItems: alignmentV,
          color: foregroundColor,
          backgroundColor: backgroundColor
        },
        "& .MuiOutlinedInput-root": {
          "& .MuiOutlinedInput-notchedOutline": {
            outlineWidth: borderWidth,
            outlineStyle: borderStyle,
            outlineColor: borderColor
          },
          "&.Mui-focused": {
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "0px"
            }
          }
        }
      }}
    />
  );
};

const InputWidgetProps = {
  ...InputComponentProps,
  ...PVWidgetPropType
};

export const Input = (
  props: InferWidgetProps<typeof InputWidgetProps>
): JSX.Element => <Widget baseWidget={SmartInputComponent} {...props} />;

registerWidget(Input, InputWidgetProps, "input");
