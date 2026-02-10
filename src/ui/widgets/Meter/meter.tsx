import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  IntPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt
} from "../propTypes";
import { ColorUtils } from "../../../types/color";
import { GaugeComponent } from "react-gauge-component";
import {
  buildSubArcs,
  convertInfAndNanToUndefined,
  createTickPositions,
  formatTickLabels,
  formatValue,
  NumberFormatEnum
} from "./meterUtilities";
import { getPvValueAndName } from "../utils";
import { dTypeGetDoubleValue } from "../../../types/dtypes/dType";
import { fontToCss } from "../../../types/font";

export const MeterProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  format: IntPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  needleColor: ColorPropOpt,
  precision: IntPropOpt,
  font: FontPropOpt,
  transparent: BoolPropOpt,
  showUnits: BoolPropOpt,
  showValue: BoolPropOpt,
  width: FloatPropOpt,
  height: FloatPropOpt
};

export const MeterComponent = (
  props: InferWidgetProps<typeof MeterProps> & PVComponent
): JSX.Element => {
  const {
    pvData,
    format = NumberFormatEnum.Default,
    height = 120,
    width = 240,
    limitsFromPv = true,
    font,
    foregroundColor = ColorUtils.fromRgba(0, 0, 0, 1),
    needleColor = ColorUtils.fromRgba(255, 5, 7, 1),
    precision = undefined,
    showUnits = true,
    showValue = true,
    transparent = false
  } = props;
  const { value } = getPvValueAndName(pvData);

  const units = value?.display.units ?? "";
  const numValue = dTypeGetDoubleValue(value) ?? 0;

  const getFormattedValue = useMemo(
    () => formatValue(numValue, format, precision ?? 3, units, showUnits),
    [numValue, format, precision, units, showUnits]
  );

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.colorString ?? "rgba(250, 250, 250, 1)");

  const display = value?.display;
  const alarmRangeMin = convertInfAndNanToUndefined(display?.alarmRange?.min);
  const alarmRangeMax = convertInfAndNanToUndefined(display?.alarmRange?.max);
  const warningRangeMin = convertInfAndNanToUndefined(
    display?.warningRange?.min
  );
  const warningRangeMax = convertInfAndNanToUndefined(
    display?.warningRange?.max
  );

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv) {
    const pvMin =
      display?.controlRange?.min ?? alarmRangeMin ?? warningRangeMin;
    const pvMax =
      display?.controlRange?.max ?? alarmRangeMax ?? warningRangeMax;
    minimum = pvMin ?? 0;
    maximum = pvMax ?? 100;
  }

  // For a semi semicircle height / width is 2, but allow extra height for some padding
  const scaledWidth = width / height > 1.9 ? 1.9 * height : width;

  // Calculate the tick positions and the string labels
  const tickPositions = createTickPositions(minimum, maximum);
  const tickLabels = formatTickLabels(tickPositions);

  return (
    <Box
      alignItems="center"
      justifyItems="center"
      alignContent="center"
      justifyContent="center"
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
        backgroundColor: backgroundColor,
        position: "absolute"
      }}
    >
      <GaugeComponent
        style={{
          height: "100%",
          width: scaledWidth,
          display: "flex",
          position: "absolute",
          backgroundColor: "transparent"
        }}
        value={numValue}
        minValue={minimum}
        maxValue={maximum}
        type="semicircle"
        marginInPercent={{
          top: 0.005,
          bottom: 0.02,
          left: 0.09,
          right: 0.09
        }}
        pointer={{
          color: needleColor.colorString,
          elastic: false,
          animate: false,
          length: 0.95
        }}
        arc={{
          padding: 0,
          cornerRadius: 0,
          subArcs: buildSubArcs(
            foregroundColor.colorString,
            minimum,
            maximum,
            alarmRangeMin,
            warningRangeMin,
            warningRangeMax,
            alarmRangeMax
          ),
          width: 0.03
        }}
        labels={{
          valueLabel: {
            style: {
              fontFamily: fontToCss(font)?.fontFamily,
              fill: foregroundColor.colorString,
              textShadow: "none"
            },
            formatTextValue: getFormattedValue,
            matchColorWithArc: true,
            hide: !showValue
          },
          tickLabels: {
            type: "inner",
            ticks: tickPositions.map(
              (
                value: number,
                index: number
              ): {
                value: number;
                valueConfig: { formatTextValue: () => string };
              } => ({
                value: value,
                valueConfig: {
                  formatTextValue: () => tickLabels[index]
                }
              })
            ),
            defaultTickValueConfig: {
              style: {
                fill: foregroundColor.colorString,
                fontSize: `${scaledWidth * 0.04}px`,
                textShadow: "none",
                fontFamily: fontToCss(font)?.fontFamily
              }
            },
            defaultTickLineConfig: {
              color: foregroundColor.colorString
            }
          }
        }}
      />
    </Box>
  );
};

const MeterWidgetProps = {
  ...MeterProps,
  ...PVWidgetPropType
};

export const Meter = (
  props: InferWidgetProps<typeof MeterWidgetProps>
): JSX.Element => <Widget baseWidget={MeterComponent} {...props} />;

registerWidget(Meter, MeterWidgetProps, "meter");
