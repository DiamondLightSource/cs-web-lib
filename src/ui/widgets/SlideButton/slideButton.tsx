import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  BoolPropOpt,
  StringPropOpt,
  FontPropOpt,
  StringOrNumPropOpt
} from "../propTypes";
import { writePv } from "../../hooks/useSubscription";
import { dTypeGetDoubleValue, newDType } from "../../../types/dtypes";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { Switch as MuiSwitch } from "@mui/material";
import { getPvValueAndName } from "../utils";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "slidebutton";

const SlideButtonProps = {
  pvName: StringPropOpt,
  onState: IntPropOpt,
  offState: IntPropOpt,
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  onLabel: StringPropOpt,
  offLabel: StringPropOpt,
  labelsFromPv: BoolPropOpt,
  enabled: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  font: FontPropOpt,
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt
};

export type SlideButtonComponentProps = InferWidgetProps<
  typeof SlideButtonProps
> &
  PVComponent;

export const SlideButtonComponent = (
  props: SlideButtonComponentProps
): JSX.Element => {
  const style = useStyle(
    {
      ...props,
      customColors: { onColor: props?.onColor, offColor: props?.offColor }
    },
    widgetName
  );

  const {
    pvData,
    onState = 1,
    offState = 0,
    labelsFromPv = false,
    enabled = true,
    height = WIDGET_DEFAULT_SIZES["slide_button"][1],
    width = WIDGET_DEFAULT_SIZES["slide_button"][0]
  } = props;

  const {
    value,
    effectivePvName: pvName,
    readOnly
  } = getPvValueAndName(pvData);

  // Allow the PV's enum choices to override the label props when labelsFromPv is set
  let { onLabel, offLabel } = props;

  if (labelsFromPv) {
    const choices = value?.display.choices;
    if (choices && choices?.length === 2) {
      offLabel = choices[0];
      onLabel = choices[1];
    }
  }

  const doubleValue = dTypeGetDoubleValue(value);
  const isOn = doubleValue === onState;

  function handleChange() {
    if (pvName && !readOnly) {
      writePv(pvName, newDType({ doubleValue: isOn ? offState : onState }));
    }
  }

  return (
    <div
      style={{
        height: typeof height === "string" ? "100%" : height,
        width: typeof width === "string" ? "100%" : width,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        ...style.colors,
        ...style.font,
        cursor: readOnly || !enabled ? "not-allowed" : "default"
      }}
    >
      {offLabel && <span style={{ opacity: isOn ? 0.5 : 1 }}>{offLabel}</span>}
      <MuiSwitch
        checked={isOn}
        onChange={handleChange}
        disabled={readOnly || !enabled}
        slotProps={{ input: { "aria-label": "slide button" } }}
        sx={{
          // MUI applies its own backgroundColor to the track with high specificity,
          // so !important is required for custom colours to take effect.
          "& .MuiSwitch-track": {
            ...(style?.customColors?.offColor && {
              backgroundColor: `${style.customColors.offColor} !important`
            }),
            opacity: "1 !important"
          },
          "& .Mui-checked + .MuiSwitch-track": {
            ...(style?.customColors?.onColor && {
              backgroundColor: `${style.customColors.onColor} !important`
            }),
            opacity: "1 !important"
          },
          "& .Mui-disabled + .MuiSwitch-track": {
            opacity: "0.5 !important"
          }
        }}
      />
      {onLabel && <span style={{ opacity: isOn ? 1 : 0.5 }}>{onLabel}</span>}
    </div>
  );
};

const SlideButtonWidgetProps = {
  ...SlideButtonProps,
  ...PVWidgetPropType
};

export const SlideButton = (
  props: InferWidgetProps<typeof SlideButtonWidgetProps>
): JSX.Element => <Widget baseWidget={SlideButtonComponent} {...props} />;

registerWidget(SlideButton, SlideButtonWidgetProps, widgetName);
