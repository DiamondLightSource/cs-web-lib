import React, { useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import {
  InferWidgetProps,
  MacrosPropOpt,
  ColorPropOpt,
  StringArrayPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Box } from "@mui/material";
import { useStyle } from "../../hooks/useStyle";
import { getPvValueAndName } from "../utils";
import { useNotification } from "../../hooks";

const widgetName = "demoImage";

const DemoImageProps = {
  macros: MacrosPropOpt,
  backgroundColor: ColorPropOpt,
  mjpgEndpoints: StringArrayPropOpt
};

export const DemoImageComponent = (
  props: InferWidgetProps<typeof DemoImageProps> & PVComponent
): JSX.Element => {
  const { colors } = useStyle(props, widgetName);
  const { effectivePvName } = getPvValueAndName(props?.pvData);
  const urls = buildMjpgPvUrls(props?.mjpgEndpoints, effectivePvName);

  const [src, setSrc] = useState(urls?.[0]);
  const [numberOfFailures, setNumberOfFailures] = useState(0);
  const { showWarning } = useNotification();

  const handleError = () => {
    if (numberOfFailures + 1 < (urls?.length ?? 0)) {
      setSrc(urls?.[numberOfFailures + 1]);
      setNumberOfFailures(prev => prev + 1);
    } else {
      // reset in case of re-render
      setNumberOfFailures(0);
      showWarning(
        `Could not load mjpg image stream for the PV: ${effectivePvName}`
      );
    }
  };

  return (
    <Box
      component="img"
      src={src}
      alt={`PvName: ${effectivePvName}`}
      onError={handleError}
      sx={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
        backgroundColor: colors?.backgroundColor
      }}
    />
  );
};

export const buildMjpgPvUrls = (
  mjpgEndpoints: (string | null | undefined)[] | undefined,
  pvName: string
): string[] => {
  if (!pvName || !mjpgEndpoints || mjpgEndpoints?.length === 0) {
    return [];
  }

  const trimmedPvName = pvName
    .replace(/^pva:\/\//, "")
    .replace(/:ARRAY$/, ":OUTPUT");

  const additionalPvData = mjpgEndpoints
    ?.filter(x => x != null)
    ?.map((endpoint, i) => `${endpoint}/${trimmedPvName}`);

  return additionalPvData ?? [];
};

const DemoImageWidgetProps = {
  ...DemoImageProps,
  ...PVWidgetPropType
};

export const DemoImage = (
  props: InferWidgetProps<typeof DemoImageWidgetProps>
): JSX.Element => <Widget baseWidget={DemoImageComponent} {...props} />;

registerWidget(DemoImage, DemoImageWidgetProps, widgetName);
