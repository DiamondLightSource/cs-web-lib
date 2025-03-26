import React, { useState } from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  StringPropOpt,
  FloatPropOpt,
  FontPropOpt,
  ColorPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FormControlLabel,
  Checkbox as CheckboxMui,
  ThemeProvider
} from "@mui/material";
import { defaultColours } from "../../../colourscheme";

export const CheckboxProps = {
  label: StringPropOpt,
  width: FloatPropOpt,
  height: FloatPropOpt,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt
};

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
  const [checked, setChecked] = useState(true);

  const handleChange = (): void => {
    setChecked(!checked);
  };

  return (
    <ThemeProvider theme={defaultColours}>
      <FormControlLabel
        sx={{
          color:
            props.foregroundColor?.toString() ??
            defaultColours.palette.primary.contrastText,
          "&:npt($checked) .MuiIconButton-label:after": {
            color:
              props.foregroundColor?.toString() ??
              defaultColours.palette.primary.main
          }
        }}
        control={
          <CheckboxMui
            checked={checked}
            onChange={handleChange}
            sx={{
              color: defaultColours.palette.primary.main
            }}
          />
        }
        label={props.label}
      />
    </ThemeProvider>
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
