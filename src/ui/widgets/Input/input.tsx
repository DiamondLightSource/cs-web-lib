import React, { useState } from "react";

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
  BorderPropOpt
} from "../propTypes";
import { AlarmQuality, DType } from "../../../types/dtypes";
import { TextField as MuiTextField, styled } from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";

const InputWidgetProps = {
  ...PVWidgetPropType,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  transparent: BoolPropOpt,
  alarmSensitive: BoolPropOpt,
  enabled: BoolPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"]),
  textAlignV: ChoicePropOpt(["top", "center", "bottom"]),
  border: BorderPropOpt
};

const TextField = styled(MuiTextField)({
  "&.MuiFormControl-root": {
    height: "100%",
    width: "100%",
    display: "block"
  },
  "& .MuiInputBase-root": {
    height: "100%",
    width: "100%"
  },
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": {
      borderColor: "#1976D2"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1976D2"
    },
    "&.Mui-disabled": {
      cursor: "not-allowed",
      pointerEvents: "all !important"
    }
  }
});

export const SmartInputComponent = (
  props: PVInputComponent & InferWidgetProps<typeof InputWidgetProps>
): JSX.Element => {
  const {
    enabled = true,
    transparent = false,
    textAlign = "left",
    textAlignV = "center"
  } = props;

  const font = props.font?.css() ?? diamondTheme.typography;

  const alarmQuality = props.value?.getAlarm().quality ?? AlarmQuality.VALID;
  const foregroundColor = props.alarmSensitive
    ? function () {
        switch (alarmQuality) {
          case AlarmQuality.UNDEFINED:
          case AlarmQuality.INVALID:
          case AlarmQuality.CHANGING:
            return "var(--invalid)";
          case AlarmQuality.WARNING:
            return "var(--alarm)";
          case AlarmQuality.ALARM:
            return "var(--alarm)";
          case AlarmQuality.VALID:
            return (
              props.foregroundColor?.toString() ??
              diamondTheme.palette.primary.contrastText
            );
        }
      }
    : (props.foregroundColor?.toString() ??
      diamondTheme.palette.primary.contrastText);

  let alignmentV = "center";
  if (textAlignV === "top") {
    alignmentV = "start";
  } else if (textAlignV === "bottom") {
    alignmentV = "end";
  }

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? "#80FFFF");

  const [inputValue, setInputValue] = useState(
    props.value?.getStringValue() ?? ""
  );

  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      writePv(props.pvName, new DType({ stringValue: inputValue }));
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <TextField
      disabled={!enabled}
      value={inputValue}
      variant="outlined"
      type="text"
      onKeyDown={onKeyPress}
      onChange={event => setInputValue(event.target.value)}
      sx={{
        "& .MuiInputBase-input": {
          textAlign: textAlign,
          padding: "4px",
          fontFamily: font
        },
        "& .MuiInputBase-root": {
          alignItems: alignmentV,
          color: foregroundColor,
          backgroundColor: backgroundColor
        },
        "& fieldset": {
          border: props.border?.width ?? "1",
          borderColor: props.border?.color.toString() ?? "#0000003B"
        }
      }}
    />
  );
};

export const Input = (
  props: InferWidgetProps<typeof InputWidgetProps>
): JSX.Element => <Widget baseWidget={SmartInputComponent} {...props} />;

registerWidget(Input, InputWidgetProps, "input");
