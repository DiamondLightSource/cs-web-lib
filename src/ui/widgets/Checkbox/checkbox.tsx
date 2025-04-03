import React, { useState } from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  StringPropOpt,
  FloatPropOpt,
  FontPropOpt,
  ColorPropOpt,
  BoolPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FormControlLabel as MuiFormControlLabel,
  Checkbox as MuiCheckbox,
  styled
} from "@mui/material";
import { diamondTheme } from "../../../diamondTheme";

export const CheckboxProps = {
  label: StringPropOpt,
  width: FloatPropOpt,
  height: FloatPropOpt,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  enabled: BoolPropOpt
};

const FormControlLabel = styled(MuiFormControlLabel)({
  "&.MuiFormControlLabel-root": {
    display: "block",
    alignItems: "center",
    cursor: "pointer",
    whiteSpace: "nowrap",
    wordBreak: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: 0
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  }
});

export type CheckboxComponentProps = InferWidgetProps<typeof CheckboxProps> &
  PVComponent;

/**
 * Checkbox component, aka a toggleable component that places a tick
 * inside it when toggled. Allows for a label to be placed to the right of
 * the checkbox
 * @param props CheckboxComponentProps, optional parameters on top of the normal
 * widget parameters are: the label, the width, the height, the font, and the foreground color
 */
export const CheckboxComponent = (
  props: CheckboxComponentProps
): JSX.Element => {
  const { enabled = true } = props;
  const [checked, setChecked] = useState(true);

  const handleChange = (): void => {
    setChecked(!checked);
  };

  return (
    <FormControlLabel
      disabled={!enabled}
      sx={{
        color:
          props.foregroundColor?.toString() ??
          diamondTheme.palette.primary.contrastText,
        ".MuiFormControlLabel-label": {
          fontFamily: props.font?.css() ?? diamondTheme.typography
        }
      }}
      control={
        <MuiCheckbox
          checked={checked}
          onChange={handleChange}
          sx={{
            color: diamondTheme.palette.primary.main,
            "&.Mui-checked": {
              color: diamondTheme.palette.primary.main
            }
          }}
        />
      }
      label={props.label}
    />
  );
};

const CheckboxWidgetProps = {
  ...CheckboxProps,
  ...PVWidgetPropType
};

export const Checkbox = (
  props: InferWidgetProps<typeof CheckboxWidgetProps>
): JSX.Element => <Widget baseWidget={CheckboxComponent} {...props} />;

registerWidget(Checkbox, CheckboxWidgetProps, "checkbox");
