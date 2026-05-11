import React, { useState } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { InferWidgetProps, MacrosPropOpt, ColorPropOpt } from "../propTypes";
import { registerWidget } from "../register";
import { Box } from "@mui/material";
import { useStyle } from "../../hooks/useStyle";
import { PvArrayResults, PvState } from "../../../redux/csState";
import { getPvValueAndName } from "../utils";
import { DAlarmNONE, newDType } from "../../../types/dtypes";
import { useNotification } from "../../hooks";

const widgetName = "demoImage";

const DemoImageProps = {
  macros: MacrosPropOpt,
  backgroundColor: ColorPropOpt
};

export const DemoImageComponent = (
  props: InferWidgetProps<typeof DemoImageProps> & PVComponent
): JSX.Element => {
  const { colors } = useStyle(props, widgetName);
  const { value, effectivePvName } = getPvValueAndName(props?.pvData);

  const [src, setSrc] = useState(value?.value?.stringValue);
  const [numberOfFailures, setNumberOfFailures] = useState(0);
  const { showWarning } = useNotification();

  const handleError = () => {
    if (numberOfFailures < (props?.pvData?.length ?? 0) - 1) {
      const { value } = getPvValueAndName(props?.pvData, numberOfFailures + 1);
      setSrc(value?.value?.stringValue);
      setNumberOfFailures(numberOfFailures + 1);
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

export const overridePvSubscriptionsWithMjpgUrl =
  (mjpgEndpoints?: (string | null | undefined)[]) =>
  (
    pvNameArray: string[]
  ): { pvNameSubscriptions: string[]; additionalPvData: PvArrayResults } => {
    let additionalPvData: PvArrayResults = {};

    if (pvNameArray.length > 0 && mjpgEndpoints && mjpgEndpoints.length > 0) {
      // remove leading pva protocol string and replace :ARRAY with :OUTPUT
      const trimmedPvName = pvNameArray[0]
        .replace(/^pva:\/\//, "")
        .replace(/:ARRAY$/, ":OUTPUT");

      // Create a dictionary of pv data values that contain the url of the mjpg,
      // typically one primary, one fallback url
      additionalPvData = mjpgEndpoints
        ?.filter(x => x != null)
        ?.map(
          (endpoint, i) =>
            [
              {
                value: newDType(
                  { stringValue: `${endpoint}/${trimmedPvName}` },
                  DAlarmNONE()
                )
              } as PvState,
              trimmedPvName
            ] as [PvState, string]
        )
        ?.reduce((acc, val, i) => {
          acc[`${val[1]}_${i}`] = val;
          return acc;
        }, additionalPvData);
    }

    // don't subscribe to any other pvs via PVWS.
    const pvNameSubscriptions: string[] = [];
    return { pvNameSubscriptions, additionalPvData };
  };

const DemoImageWidgetProps = {
  ...DemoImageProps,
  ...PVWidgetPropType
};

export const DemoImage = (
  props: InferWidgetProps<typeof DemoImageWidgetProps>
): JSX.Element => (
  <Widget
    baseWidget={DemoImageComponent}
    {...props}
    overridePvSubscriptionsCallback={overridePvSubscriptionsWithMjpgUrl(
      props?.mjpgEndpoints
    )}
  />
);

registerWidget(DemoImage, DemoImageWidgetProps, widgetName);
