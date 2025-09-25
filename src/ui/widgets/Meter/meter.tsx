import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { Widget } from "../widget";
import { PVInputComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  IntPropOpt,
  InferWidgetProps,
  FontPropOpt,
  ColorPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import { GaugeComponent } from "react-gauge-component";
import {
  buildSubArcs,
  convertInfAndNanToUndefined,
  createIntervals,
  formatValue,
  NumberFormatEnum
} from "./meterUtilities";

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
  props: InferWidgetProps<typeof MeterProps> & PVInputComponent
): JSX.Element => {
  const {
    value,
    format = NumberFormatEnum.Default,
    height = 120,
    width = 240,
    limitsFromPv = true,
    font,
    foregroundColor = Color.fromRgba(0, 0, 0, 1),
    needleColor = Color.fromRgba(255, 5, 7, 1),
    precision = undefined,
    showUnits = true,
    showValue = true,
    transparent = false
  } = props;
  const units = value?.display.units ?? "";
  const numValue = value?.getDoubleValue() ?? 0;

  const getFormattedValue = useMemo(
    () => formatValue(numValue, format, precision ?? 3, units, showUnits),
    [numValue, format, precision, units, showUnits]
  );

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? "rgba(250, 250, 250, 1)");

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
      <Box
        sx={{
          display: "flex",
          height: "100%",
          width: scaledWidth,
          position: "absolute",
          backgroundColor: "transparent"
        }}
      >
        <GaugeComponent
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
            color: needleColor.toString(),
            elastic: false,
            animate: false,
            length: 0.95
          }}
          arc={{
            padding: 0,
            cornerRadius: 0,
            subArcs: buildSubArcs(
              foregroundColor.toString(),
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
                fontFamily: font?.css().fontFamily,
                fill: foregroundColor.toString(),
                textShadow: "none"
              },
              formatTextValue: getFormattedValue,
              matchColorWithArc: true,
              hide: !showValue
            },
            tickLabels: {
              type: "inner",
              ticks: createIntervals(minimum, maximum).map(
                (
                  x: number
                ): {
                  value: number;
                  valueConfig: { formatTextValue: () => string };
                } => ({
                  value: x,
                  valueConfig: {
                    formatTextValue: formatValue(x, 1, 2, "", false)
                  }
                })
              ),
              defaultTickValueConfig: {
                style: {
                  fill: foregroundColor.toString(),
                  fontSize: `${scaledWidth * 0.04}px`,
                  textShadow: "none",
                  fontFamily: font?.css().fontFamily
                }
              },
              defaultTickLineConfig: {
                color: foregroundColor.toString()
              }
            }
          }}
        />
      </Box>
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
