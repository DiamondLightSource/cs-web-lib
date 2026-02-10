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
  FloatPropOpt,
  StringOrNumPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import {
  dTypeByteArrToString,
  dTypeCoerceDouble,
  dTypeCoerceString,
  dTypeGetAlarm,
  dTypeGetArrayValue,
  dTypeGetDisplay
} from "../../../types/dtypes/dType";
import { TextField as MuiTextField, styled, useTheme } from "@mui/material";
import { calculateRotationTransform, getPvValueAndName } from "../utils";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { AlarmQuality } from "../../../types/dtypes/dAlarm";
import { borderToCss } from "../../../types/border";
import { fontToCss } from "../../../types/font";

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
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt
};

const TextField = styled(MuiTextField)({
  // MUI Textfield contains a fieldset with a legend that needs to be removed
  "& .css-w4cd9x": {
    lineHeight: "0px"
  },
  "& .MuiInputBase-root": {
    height: "100%",
    width: "100%",
    padding: "0px"
  },
  "& .MuiInputBase-input": {
    padding: "0px",
    lineHeight: 1.2,
    textOverflow: "clip",
    whiteSpace: "pre-wrap",
    height: "100%",
    width: "100%"
  },
  "& .MuiOutlinedInput-root": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderRadius: "4px",
      borderWidth: "0px",
      inset: "0px"
    }
  }
});

// Needs to be exported for testing
export type ReadbackComponentProps = InferWidgetProps<typeof ReadbackProps> &
  PVComponent;

export const ReadbackComponent = (
  props: ReadbackComponentProps
): JSX.Element => {
  const theme = useTheme();
  const {
    enabled = true,
    pvData,
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
    visible = true,
    height = WIDGET_DEFAULT_SIZES["textupdate"][1],
    width = WIDGET_DEFAULT_SIZES["textupdate"][0]
  } = props;

  const { value } = getPvValueAndName(pvData);

  // Decide what to display.
  const display = dTypeGetDisplay(value);
  // In Phoebus, default precision -1 seems to usually be 3. The toFixed functions
  // cannot accept -1 as a valid answer
  let prec = precisionFromPv ? (display?.precision ?? precision) : precision;
  if (prec === -1) prec = 3;

  let displayedValue;
  if (!value) {
    displayedValue = text;
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

  let foregroundColor =
    props.foregroundColor?.colorString ?? theme.palette.primary.contrastText;
  let borderColor = props.border?.color.colorString ?? "#000000";
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
    }
  }

  const font = fontToCss(props.font) ?? theme.typography;

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.colorString ?? theme.palette.primary.main);

  let alignmentV = "center";
  if (textAlignV === "top") {
    alignmentV = "start";
  } else if (textAlignV === "bottom") {
    alignmentV = "end";
  }

  const [inputWidth, inputHeight, transform] = calculateRotationTransform(
    rotationStep,
    width,
    height
  );

  return (
    <TextField
      disabled={!enabled}
      value={displayedValue}
      multiline={wrapWords}
      variant="outlined"
      slotProps={{
        input: {
          readOnly: true
        }
      }}
      sx={{
        "&.MuiFormControl-root": {
          display: visible ? "flex" : "none",
          // If size is given as %, rem or vh, allow element to fill parent div
          // Otherwise, use the calculated height that accounts for rotationStep
          height: typeof height === "string" ? "100%" : inputHeight,
          width: typeof width === "string" ? "100%" : inputWidth,
          transform: transform
        },
        "& .MuiInputBase-input": {
          textAlign: textAlign,
          font: font
        },
        "& .MuiInputBase-root": {
          justifyContent: alignmentV,
          flexDirection: "column",
          alignItems: alignmentV,
          overflow: "hidden",
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
              outlineWidth: "2px",
              borderWidth: "0px"
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
