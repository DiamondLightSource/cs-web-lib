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
  IntPropOpt
} from "../propTypes";
import { AlarmQuality, DType } from "../../../types/dtypes";
import { TextField as MuiTextField, styled, useTheme } from "@mui/material";

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
  precision: IntPropOpt,
  formatType: ChoicePropOpt(["default", "decimal", "exponential", "string"]),
  showUnits: BoolPropOpt,
  precisionFromPv: BoolPropOpt
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
    textOverflow: "clip",
    whiteSpace: "pre-wrap",
    height: "100%",
    width: "100%",
    "&.Mui-disabled": {
      cursor: "not-allowed",
      pointerEvents: "all !important"
    }
  },
  "& .MuiOutlinedInput-root": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderRadius: "4px",
      borderWidth: "0px",
      inset: "0px"
    }
  }
});

export const SmartInputComponent = (
  props: PVInputComponent & InferWidgetProps<typeof InputComponentProps>
): JSX.Element => {
  const theme = useTheme();
  const {
    precision = -1,
    enabled = true,
    transparent = false,
    textAlign = "left",
    textAlignV = "center",
    value = null,
    multiLine = false,
    alarmSensitive = true,
    showUnits = false,
    precisionFromPv = false,
    formatType = "default"
  } = props;

  // Decide what to display.
  const display = value?.getDisplay();
  // In Phoebus, default precision -1 seems to usually be 3. The toFixed functions
  // cannot accept -1 as a valid answer
  let prec = precisionFromPv ? (display?.precision ?? precision) : precision;
  if (prec === -1) prec = 3;

  let displayedValue;
  if (!value) {
    displayedValue = "";
  } else {
    if (value.display.choices) {
      // Enum PV so use string representation.
      displayedValue = DType.coerceString(value);
    } else if (prec !== undefined && !isNaN(DType.coerceDouble(value))) {
      if (formatType === "exponential") {
        displayedValue = DType.coerceDouble(value).toExponential(prec);
      } else {
        displayedValue = DType.coerceDouble(value).toFixed(prec);
      }
    } else if (formatType === "string") {
      const valarr = value.getArrayValue();
      if (valarr !== undefined) {
        displayedValue = DType.byteArrToString(valarr);
      } else {
        displayedValue = DType.coerceString(value);
      }
    } else if (value.getArrayValue() !== undefined && prec !== undefined) {
      displayedValue = "";
      const array = Array.prototype.slice.call(value.getArrayValue());
      for (let i = 0; i < array.length; i++) {
        displayedValue = displayedValue.concat(array[i].toFixed(prec));
        if (i < array.length - 1) {
          displayedValue = displayedValue.concat(", ");
        }
      }
    } else {
      displayedValue = DType.coerceString(value);
    }
  }

  // Add units if there are any and show units is true.
  if (showUnits && display?.units) {
    displayedValue = displayedValue + ` ${display.units}`;
  }

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

  const [inputValue, setInputValue] = useState(displayedValue ?? "");

  useEffect(() => {
    if (value) {
      setInputValue(displayedValue ?? "");
    }
  }, [value, displayedValue]);

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
      aria-label="input"
      disabled={!enabled}
      value={inputValue}
      maxRows={multiLine ? "auto" : 1}
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
          font: font,
          "& .MuiOutlinedInput-input": {
            "&.Mui-disabled": {
              WebkitTextFillColor: foregroundColor.replace(/[^,]+(?=\))/, "0.4")
            }
          }
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
