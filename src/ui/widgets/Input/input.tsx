import React, { useState } from "react";

import classes from "./input.module.css";
import { writePv } from "../../hooks/useSubscription";
import { Widget } from "../widget";
import { PVInputComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  FontPropOpt,
  ChoicePropOpt,
  ColorPropOpt,
  BoolPropOpt
} from "../propTypes";
import { Font } from "../../../types/font";
import { Color } from "../../../types/color";
import { AlarmQuality, DType } from "../../../types/dtypes";
import { InputComponent } from "../../components/input/input";
import { TextField, ThemeProvider } from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";

export interface InputProps {
  pvName: string;
  value: string;
  readonly: boolean;
  foregroundColor?: Color;
  backgroundColor?: Color;
  transparent: boolean;
  alarm: AlarmQuality;
  alarmSensitive: boolean;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  font?: Font;
  textAlign?: "left" | "center" | "right";
}

const InputWidgetProps = {
  ...PVWidgetPropType,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  transparent: BoolPropOpt,
  alarmSensitive: BoolPropOpt,
  enabled: BoolPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"])
};

export const SmartInputComponent = (
  props: PVInputComponent & {
    font?: Font;
    foregroundColor?: Color;
    backgroundColor?: Color;
    transparent?: boolean;
    alarmSensitive?: boolean;
    enabled?: boolean;
    textAlign?: "left" | "center" | "right";
  }
): JSX.Element => {
  const {
    enabled = true,
    transparent = false,
    foregroundColor = diamondTheme.palette.primary.contrastText
  } = props;

  const alarmQuality = props.value?.getAlarm().quality ?? AlarmQuality.VALID;
  // if (props.textAlign) {
  //   style.textAlign = props.textAlign;
  // }
  // style.color = props.foregroundColor?.toString();
  // style.backgroundColor = props.backgroundColor?.toString();
  // // Transparent prop overrides backgroundColor.
  // if (props.transparent) {
  //   style["backgroundColor"] = "transparent";
  // }
  // if (props.readonly) {
  //   allClasses += ` ${classes.readonly}`;
  // }
  // if (props.alarmSensitive) {
  //   switch (alarmQuality) {
  //     case AlarmQuality.UNDEFINED:
  //     case AlarmQuality.INVALID:
  //     case AlarmQuality.CHANGING:
  //       style.color = "var(--invalid)";
  //       break;
  //     case AlarmQuality.WARNING:
  //       style.color = "var(--alarm)";
  //       break;
  //     case AlarmQuality.ALARM:
  //       style.color = "var(--alarm)";
  //       break;
  //   }
  // }

  const font = props.font?.css() ?? diamondTheme.typography;
  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? diamondTheme.palette.primary.main);

  const [inputValue, setInputValue] = useState("");

  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      writePv(props.pvName, new DType({ stringValue: inputValue }));
      event.currentTarget.blur();
    }
  };

  return (
    <TextField
      disabled={!enabled}
      variant="outlined"
      type="text"
      onKeyDown={onKeyPress}
      onChange={event => setInputValue(event.target.value)}
      sx={{
        "& .MuiInputBase-input": {
          fontFamily: font
        },
        "&.MuiFormControl-root": {
          height: "100%",
          width: "100%",
          display: "block"
        },
        "& .MuiInputBase-root": {
          height: "100%",
          width: "100%",
          padding: 0,
          color: foregroundColor.toString(),
          backgroundColor: backgroundColor
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            borderColor: "#0000FF"
          },
        "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
          borderColor: "#00FF00"
        }
      }}
    />
  );
};

export const Input = (
  props: InferWidgetProps<typeof InputWidgetProps>
): JSX.Element => <Widget baseWidget={SmartInputComponent} {...props} />;

registerWidget(Input, InputWidgetProps, "input");
