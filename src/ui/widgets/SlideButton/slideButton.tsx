import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ColorPropOpt,
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
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  label: StringPropOpt,
  enabled: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  font: FontPropOpt,
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt,
  visible: BoolPropOpt
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
    widgetName,
    props.class
  );

  const {
    pvData,
    enabled = true,
    visible = true,
    label = "Label",
    height = WIDGET_DEFAULT_SIZES["slide_button"][1],
    width = WIDGET_DEFAULT_SIZES["slide_button"][0]
  } = props;

  const {
    value,
    effectivePvName: pvName,
    readOnly
  } = getPvValueAndName(pvData);

  const doubleValue = dTypeGetDoubleValue(value);
  const isOn = Boolean(doubleValue);

  function handleChange() {
    if (pvName && !readOnly) {
      writePv(pvName, newDType({ doubleValue: isOn ? 0 : 1 }));
    }
  }

  return (
    <div
      style={{
        height: typeof height === "string" ? "100%" : height,
        width: typeof width === "string" ? "100%" : width,
        display: visible ? "flex" : "none",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "4px",
        ...style.colors,
        ...style.font,
        cursor: readOnly || !enabled ? "not-allowed" : "default"
      }}
    >
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
      {label && (
        <span
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            minWidth: 0
          }}
        >
          {label}
        </span>
      )}
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
