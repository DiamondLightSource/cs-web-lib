import React from "react";

import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";

import {
  IntPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  ChoicePropOpt,
  FontPropOpt,
  ColorPropOpt,
  BorderPropOpt,
  StringPropOpt,
  FloatPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { AlarmQuality, DType } from "../../../types/dtypes";
import { TextField as MuiTextField, styled } from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";

const ReadbackProps = {
  precision: IntPropOpt,
  formatType: ChoicePropOpt(["default", "decimal", "exponential", "string"]),
  showUnits: BoolPropOpt,
  precisionFromPv: BoolPropOpt,
  alarmSensitive: BoolPropOpt,
  text: StringPropOpt,
  textAlign: ChoicePropOpt(["left", "center", "right"]),
  textAlignV: ChoicePropOpt(["top", "center", "bottom"]),
  transparent: BoolPropOpt,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  rotationStep: FloatPropOpt,
  visible: BoolPropOpt,
  wrapWords: BoolPropOpt,
  enabled: BoolPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt
};

const TextField = styled(MuiTextField)({
  "&.MuiFormControl-root": {
    height: "100%",
    width: "100%",
    display: "block"
  },
  "& .MuiInputBase-root": {
    height: "100%",
    width: "100%",
    padding: "4px",
    overflow: "hidden"
  }
});

// Needs to be exported for testing
export type ReadbackComponentProps = InferWidgetProps<typeof ReadbackProps> &
  PVComponent;

export const ReadbackComponent = (
  props: ReadbackComponentProps
): JSX.Element => {
  const {
    enabled = true,
    value,
    precision,
    formatType = "default",
    alarmSensitive = true,
    transparent = false,
    // text = "######",
    text = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAa",
    textAlign = "left",
    textAlignV = "top",
    showUnits = false,
    precisionFromPv = false,
<<<<<<< HEAD
    rotationStep,
    visible,
    wrapWords = false
=======
    rotationStep = 0,
    wrapWords = false,
    height = 20,
    width = 100
>>>>>>> a8b0e59 (Replace Label component with MUI TextField)
  } = props;
  // Decide what to display.
  const display = value?.getDisplay();
  const prec = precisionFromPv ? (display?.precision ?? precision) : precision;
  const rotation = `rotate(${rotationStep * -90}deg)`;

  let displayedValue;
  if (!value) {
    displayedValue = text;
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

  let foregroundColor =
    props.foregroundColor?.toString() ??
    diamondTheme.palette.primary.contrastText;
  let border = props.border?.css() ?? "0px solid #000000";

  const alarmQuality = props.value?.getAlarm().quality ?? AlarmQuality.VALID;
  if (alarmSensitive) {
    switch (alarmQuality) {
      case AlarmQuality.UNDEFINED:
      case AlarmQuality.INVALID:
      case AlarmQuality.CHANGING:
        foregroundColor = "var(--invalid)";
        border = "1px solid var(--invalid";
        break;
      case AlarmQuality.ALARM:
      case AlarmQuality.WARNING:
        foregroundColor = "var(--alarm)";
        border = "2px solid var(--alarm)";
    }
  }

  const font = props.font?.css() ?? diamondTheme.typography;

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? diamondTheme.palette.primary.main);

  let alignmentV = "center";
  if (textAlignV === "top") {
    alignmentV = "start";
  } else if (textAlignV === "bottom") {
    alignmentV = "end";
  }

  const inputHeight = rotationStep === 0 || rotationStep === 2 ? height : width;

  const inputWidth = rotationStep === 1 || rotationStep === 3 ? height : width;

  return (
<<<<<<< HEAD
    <LabelComponent
      className={className}
      text={displayedValue}
      transparent={transparent}
      textAlign={textAlign}
      textAlignV={textAlignV}
      font={font}
      foregroundColor={foregroundColor}
      backgroundColor={backgroundColor}
      border={border}
      rotationStep={rotationStep}
      visible={visible}
      wrapWords={wrapWords}
    ></LabelComponent>
=======
    <TextField
      disabled={!enabled}
      value={displayedValue}
      multiline
      variant="outlined"
      slotProps={{
        input: {
          readOnly: true
        }
      }}
      sx={{
        "& .MuiInputBase-input": {
          textAlign: textAlign,
          padding: "4px",
          font: font,
          width: "100%",
          lineHeight: 1,
          textOverflow: "ellipsis",
          whiteSpace: "pre-wrap"
        },
        "& .MuiInputBase-root": {
          alignItems: alignmentV,
          color: foregroundColor,
          backgroundColor: backgroundColor
        },
        "& .MuiOutlinedInput-root": {
          "& .MuiOutlinedInput-notchedOutline": {
            border: border,
            borderRadius: "4px"
          },
          "&.Mui-focused": {
            "& .MuiOutlinedInput-notchedOutline": {
              border: border
            }
          },
          "&:hover": {
            "& .MuiOutlinedInput-notchedOutline": {
              border: border
            }
          }
        }
      }}
    />
>>>>>>> a8b0e59 (Replace Label component with MUI TextField)
  );
};

const ReadbackWidgetProps = {
  ...ReadbackProps,
  ...PVWidgetPropType
};

export const Readback = (
  props: InferWidgetProps<typeof ReadbackWidgetProps>
): JSX.Element => (
  <Widget
    // TODO: Note that we asking for both string and double here;
    // this subverts the intended efficiency.
    pvType={{ string: true, double: true }}
    baseWidget={ReadbackComponent}
    {...props}
  />
);

registerWidget(Readback, ReadbackWidgetProps, "readback");
