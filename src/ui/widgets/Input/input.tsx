import React, { useEffect, useState } from "react";

import { writePv } from "../../hooks/useSubscription";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
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
import {
  dTypeByteArrToString,
  dTypeCoerceDouble,
  dTypeCoerceString,
  dTypeGetAlarm,
  dTypeGetArrayValue,
  dTypeGetDisplay,
  newDType,
  AlarmQuality
} from "../../../types/dtypes";
import { TextField as MuiTextField, styled, useTheme } from "@mui/material";
import { getPvValueAndName } from "../utils";
import { borderToCss } from "../../../types/border";
import { fontToCss } from "../../../types/font";

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
    lineHeight: 1.2,
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
  props: PVComponent & InferWidgetProps<typeof InputComponentProps>
): JSX.Element => {
  const theme = useTheme();
  const {
    precision = -1,
    enabled = true,
    transparent = false,
    textAlign = "left",
    textAlignV = "center",
    pvData,
    multiLine = false,
    alarmSensitive = true,
    showUnits = false,
    precisionFromPv = false,
    formatType = "default"
  } = props;

  const { value, effectivePvName: pvName } = getPvValueAndName(pvData);

  // Decide what to display.
  const display = dTypeGetDisplay(value);
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
      displayedValue = dTypeCoerceString(value);
    } else if (prec !== undefined && !isNaN(dTypeCoerceDouble(value))) {
      if (formatType === "exponential") {
        displayedValue = dTypeCoerceDouble(value).toExponential(prec);
      } else {
        displayedValue = dTypeCoerceDouble(value).toFixed(prec);
      }
    } else if (formatType === "string") {
      const valarr = dTypeGetArrayValue(value);
      if (valarr !== undefined) {
        displayedValue = dTypeByteArrToString(valarr);
      } else {
        displayedValue = dTypeCoerceString(value);
      }
    } else if (dTypeGetArrayValue(value) !== undefined && prec !== undefined) {
      displayedValue = "";
      const array = Array.prototype.slice.call(dTypeGetArrayValue(value));
      for (let i = 0; i < array.length; i++) {
        displayedValue = displayedValue.concat(array[i].toFixed(prec));
        if (i < array.length - 1) {
          displayedValue = displayedValue.concat(", ");
        }
      }
    } else {
      displayedValue = dTypeCoerceString(value);
    }
  }

  // Add units if there are any and show units is true.
  if (showUnits && display?.units) {
    displayedValue = displayedValue + ` ${display.units}`;
  }

  const font = fontToCss(props.font) ?? theme.typography;

  let foregroundColor =
    props.foregroundColor?.colorString ?? theme.palette.primary.contrastText;

  let borderColor = borderToCss(props.border)?.borderColor ?? "#000000";
  let borderStyle = borderToCss(props.border)?.borderStyle ?? "solid";
  let borderWidth = props.border?.width ?? "0px";

  const alarmQuality = dTypeGetAlarm(value).quality ?? AlarmQuality.VALID;
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
    : (props.backgroundColor?.colorString ?? "#80FFFF");

  const [inputValue, setInputValue] = useState(displayedValue ?? "");

  useEffect(() => {
    if (value) {
      setInputValue(displayedValue ?? "");
    }
  }, [value, displayedValue]);

  const onKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (multiLine) {
      if (event.key === "Enter" && event.ctrlKey) {
        writePv(pvName, newDType({ stringValue: inputValue }));
        event.currentTarget.blur();
      }
    } else {
      if (event.key === "Enter") {
        writePv(pvName, newDType({ stringValue: inputValue }));
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
