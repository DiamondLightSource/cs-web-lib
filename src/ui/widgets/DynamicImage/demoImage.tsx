import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { InferWidgetProps, MacrosPropOpt, ColorPropOpt } from "../propTypes";
import { registerWidget } from "../register";
import { Box } from "@mui/material";
import { useStyle } from "../../hooks/useStyle";
import { PvArrayResults, PvState } from "../../../redux/csState";
import { useSelector } from "react-redux";
import { selectMjpgStreamEndPoint } from "../../../redux/slices/configurationSlice";
import { getPvValueAndName } from "../utils";

const widgetName = "demoImage";

const DemoImageProps = {
  macros: MacrosPropOpt,
  backgroundColor: ColorPropOpt
};

export const DemoImageComponent = (
  props: InferWidgetProps<typeof DemoImageProps> & PVComponent
): JSX.Element => {
  const { colors } = useStyle(props, widgetName);
  const { value } = getPvValueAndName(props?.pvData);
  const imageFileName =
    value?.value?.stringValue ?? "/images/demoCameraImage.jpg";

  return (
    <Box
      component="img"
      src={imageFileName}
      alt={"Static demo image"}
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

const overridePvSubscriptionsCallback =
  (mjpgEndpoint?: string) =>
  (
    pvNameArray: string[]
  ): { pvNameSubscriptions: string[]; additionalPvData: PvArrayResults } => {
    const additionalPvData: PvArrayResults = {};

    if (pvNameArray.length > 0 && mjpgEndpoint) {
      // remove leading pva protocol string and replace :ARRAY with :OUTPUT
      const trimmedPvName = pvNameArray[0]
        .replace(/^pva:\/\//, "")
        .replace(/:ARRAY$/, ":OUTPUT");

      // Create a pv data value that contains the link to the mjpg
      additionalPvData[pvNameArray[0]] = [
        {
          value: {
            value: { stringValue: `${mjpgEndpoint}/${trimmedPvName}` },
            display: {},
            partial: false
          },
          connected: true,
          readonly: true
        } as PvState,
        pvNameArray[0]
      ];
    }

    // don't subscribe to other pvs via PVWS.
    const pvNameSubscriptions: string[] = [];
    return { pvNameSubscriptions, additionalPvData };
  };

const DemoImageWidgetProps = {
  ...DemoImageProps,
  ...PVWidgetPropType
};

export const DemoImage = (
  props: InferWidgetProps<typeof DemoImageWidgetProps>
): JSX.Element => {
  const mjpgEndpoint = useSelector(selectMjpgStreamEndPoint);

  return (
    <Widget
      baseWidget={DemoImageComponent}
      {...props}
      overridePvSubscriptionsCallback={overridePvSubscriptionsCallback(
        mjpgEndpoint
      )}
    />
  );
};

registerWidget(DemoImage, DemoImageWidgetProps, widgetName);
