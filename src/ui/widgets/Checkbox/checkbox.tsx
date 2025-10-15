import React from "react";
import { Widget } from "../widget";
import {
  InferWidgetProps,
  StringPropOpt,
  FontPropOpt,
  ColorPropOpt,
  BoolPropOpt
} from "../propTypes";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FormControlLabel as MuiFormControlLabel,
  Checkbox as MuiCheckbox,
  styled,
  useTheme
} from "@mui/material";
import { writePv } from "../../hooks/useSubscription";
import { DType } from "../../../types";
import { getPvValueAndName } from "../utils";

export const CheckboxProps = {
  label: StringPropOpt,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  enabled: BoolPropOpt,
  pvName: StringPropOpt
};

const FormControlLabel = styled(MuiFormControlLabel)({
  "&.MuiFormControlLabel-root": {
    height: "100%",
    width: "100%",
    maxHeight: "100%",
    maxWidth: "100%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    cursor: "pointer",
    whiteSpace: "nowrap",
    wordBreak: "break-word",
    overflow: "hidden",
    padding: 0,
    margin: 0
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  },
  "&.MuiButtonBase-root": {
    border: "1px solid gray"
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
  const theme = useTheme();
  const { enabled = true, label = "Label", pvData } = props;
  const { value, pvName } = getPvValueAndName(pvData);
  const checked = Boolean(value?.getDoubleValue());

  const handleChange = (event: any): void => {
    if (pvName) {
      writePv(pvName, new DType({ doubleValue: Number(event.target.checked) }));
    }
  };

  return (
    <FormControlLabel
      disabled={!enabled}
      sx={{
        color:
          props.foregroundColor?.toString() ??
          theme.palette.primary.contrastText,
        ".MuiFormControlLabel-label": {
          fontFamily: props.font?.css() ?? theme.typography
        }
      }}
      control={
        <MuiCheckbox
          color="default"
          checked={checked}
          onChange={handleChange}
          sx={{
            padding: 0,
            "&.MuiSvgIcon-root": {
              fontSize: props.font?.css().fontSize ?? theme.typography.fontSize
            }
          }}
        />
      }
      label={label}
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
