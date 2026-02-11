import React, { useContext, useEffect, useState } from "react";
import { Widget, commonCss } from "./../widget";
import { WidgetPropType } from "./../widgetProps";
import { InferWidgetProps, StringPropOpt } from "./../propTypes";
import { registerWidget } from "./../register";
import { useDevice } from "../../hooks/useDevice";
import { parseResponse } from "./deviceParser";
import { parseObject } from "../EmbeddedDisplay/jsonParser";
import {
  errorWidget,
  WidgetDescription,
  widgetDescriptionToComponent
} from "../createComponent";
import { newRelativePosition } from "../../../types/position";
import { BorderStyle, newBorder, borderNONE } from "../../../types/border";
import { ColorUtils } from "../../../types/color";
import { MacroContext } from "../../../types/macros";

const DeviceProps = {
  deviceName: StringPropOpt,
  name: StringPropOpt
};

export const DeviceComponent = (
  props: InferWidgetProps<typeof DeviceProps>
): JSX.Element => {
  // When replacing a detail panel, you can deduce device name
  // from the macro DESC on the screen.
  const displayMacros = useContext(MacroContext).macros;
  const deviceName = props.deviceName ?? (displayMacros["DESC"] || "");
  const [component, setComponent] = useState<JSX.Element>();
  const [border, setBorder] = useState(
    newBorder(BorderStyle.Dotted, ColorUtils.DISCONNECTED, 3)
  );
  const replacedDeviceName = `dev://${deviceName.replace(/\s/g, "")}`;
  const description = useDevice(replacedDeviceName);

  useEffect(() => {
    const loadComponent = async () => {
      let componentDescription: WidgetDescription;
      try {
        let jsonResponse = {};
        if (description && description.value) {
          jsonResponse = JSON.parse(description?.value?.stringValue || "");
          setBorder(borderNONE);
          const jsonObject = parseResponse(jsonResponse as any);

          componentDescription = await parseObject(jsonObject, "ca");
        } else {
          componentDescription = errorWidget(
            `No device ${replacedDeviceName} found.`,
            newRelativePosition("100%", "50px")
          );
        }
      } catch {
        componentDescription = errorWidget(
          `Failed to load device widget ${deviceName}`
        );
      }
      setComponent(
        widgetDescriptionToComponent({
          position: newRelativePosition("100%", "100%"),
          type: "display",
          children: [componentDescription]
        })
      );
    };
    loadComponent();
  }, [description, deviceName, replacedDeviceName]);

  const style = commonCss({ border });
  return <div style={style}>{component}</div>;
};

const DeviceWidgetProps = {
  ...DeviceProps,
  ...WidgetPropType
};

export const Device = (
  props: InferWidgetProps<typeof DeviceWidgetProps>
): JSX.Element => <Widget baseWidget={DeviceComponent} {...props} />;

registerWidget(Device, DeviceWidgetProps, "device");
