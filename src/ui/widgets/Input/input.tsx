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
  FloatPropOpt
} from "../propTypes";
import { Font } from "../../../types/font";
import { Color } from "../../../types/color";
import { AlarmQuality, DType } from "../../../types/dtypes";
import { TextField as MuiTextField, styled } from "@mui/material";
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
  horizontalAlignment?: number;
  verticalAlignment?: number;
}

const InputWidgetProps = {
  ...PVWidgetPropType,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  transparent: BoolPropOpt,
  alarmSensitive: BoolPropOpt,
  enabled: BoolPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"]),
  horizontalAlignment: FloatPropOpt,
  verticalAlignment: FloatPropOpt
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
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "2",
    borderColor: "#000000"
  },
  "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    border: "1",
    borderColor: "#000000"
  }
});

export const SmartInputComponent = (
  props: PVInputComponent & {
    font?: Font;
    foregroundColor?: Color;
    backgroundColor?: Color;
    transparent?: boolean;
    alarmSensitive?: boolean;
    enabled?: boolean;
    textAlign?: "left" | "center" | "right";
    horizontalAlignment?: number;
    verticalAlignment?: number;
  }
): JSX.Element => {
  const {
    enabled = true,
    transparent = false,
    horizontalAlignment = 0,
    verticalAlignment = 0
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

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? diamondTheme.palette.primary.main);

  const textAlign = function () {
    switch (horizontalAlignment) {
      case 0:
        return "left";
      case 1:
        return "center";
      case 2:
        return "right";
      default:
        return "left";
    }
  };

  const alignItems = function () {
    switch (verticalAlignment) {
      case 0:
        return "start";
      case 1:
        return "center";
      case 2:
        return "end";
      default:
        return "start";
    }
  };

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
          textAlign: textAlign,
          padding: "2px",
          fontFamily: font
        },
        "& .MuiInputBase-root": {
          alignItems: alignItems,
          color: foregroundColor,
          backgroundColor: backgroundColor
        }
      }}
    />
  );
};

export const Input = (
  props: InferWidgetProps<typeof InputWidgetProps>
): JSX.Element => <Widget baseWidget={SmartInputComponent} {...props} />;

registerWidget(Input, InputWidgetProps, "input");
