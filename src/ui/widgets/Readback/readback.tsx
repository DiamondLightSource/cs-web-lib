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
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

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
  "& .MuiInputBase-root": {
    height: "100%",
    width: "100%",
    padding: "0px"
  },
  "& .MuiInputBase-input": {
    padding: "0px",
    lineHeight: 1,
    textOverflow: "ellipsis",
    whiteSpace: "pre-wrap",
    height: "100%",
    width: "100%"
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
    text = "######",
    textAlign = "left",
    textAlignV = "top",
    showUnits = false,
    precisionFromPv = false,
    rotationStep = 0,
    wrapWords = true,
    height = WIDGET_DEFAULT_SIZES["textupdate"][1],
    width = WIDGET_DEFAULT_SIZES["textupdate"][0]
  } = props;
  // Decide what to display.
  const display = value?.getDisplay();
  const prec = precisionFromPv ? (display?.precision ?? precision) : precision;

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
        border = "1px solid var(--invalid)";
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
    : diamondTheme.typography.fontSize;

  const inputWidth = rotationStep === 0 || rotationStep === 2 ? width : height;
  const inputHeight = rotationStep === 0 || rotationStep === 2 ? height : width;

  const offset = width / 2 - height / 2;
  const transform =
    rotationStep === 1 || rotationStep === 3
      ? `rotate(${rotationStep * -90}deg) translateY(${offset}px) translateX(${offset}px)`
      : `rotate(${rotationStep * -90}deg)`;

  // Calculate max number of rows based on the height of the widget and the height of the font
  // an extra row is then subtracted to make it fit nicer
  const maxRows =
    Math.floor(inputHeight / fontSize) - 1 < 1
      ? 1
      : Math.floor(inputHeight / fontSize) - 1;

  return (
    <TextField
      disabled={!enabled}
      value={displayedValue}
      multiline={wrapWords}
      maxRows={maxRows}
      variant="outlined"
      slotProps={{
        input: {
          readOnly: true
        }
      }}
      sx={{
        "&.MuiFormControl-root": {
          height: inputHeight,
          width: inputWidth,
          display: "flex",
          transform: transform
        },
        "& .MuiInputBase-input": {
          textAlign: textAlign,
          font: font,
          lineHeight: 1
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
