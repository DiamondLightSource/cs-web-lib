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
import { dTypeGetDoubleValue } from "../../../types/dtypes";
import { useStyle } from "../../hooks/useStyle";
import { useMeasuredSize } from "../../hooks/useMeasuredSize";

const widgetName = "meter";

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
  showValue: BoolPropOpt
};

export const MeterComponent = (
  props: InferWidgetProps<typeof MeterProps> & PVComponent
): JSX.Element => {
  const {
    pvData,
    format = NumberFormatEnum.Default,
    limitsFromPv = true,
    precision = undefined,
    showUnits = true,
    showValue = true
  } = props;
  const [ref, size] = useMeasuredSize(240, 120);

  const style = useStyle(
    { ...props, customColors: { needleColor: props?.needleColor } },
    widgetName
  );
  const { value } = getPvValueAndName(pvData);

  const units = value?.display.units ?? "";
  const numValue = dTypeGetDoubleValue(value) ?? 0;

  const getFormattedValue = useMemo(
    () => formatValue(numValue, format, precision ?? 3, units, showUnits),
    [numValue, format, precision, units, showUnits]
  );

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
    minimum = pvMin ?? minimum;
    maximum = pvMax ?? maximum;
  }

  // For a semi semicircle height / width is 2, but allow extra height for some padding
  const scaledWidth =
    size.width && size.width / size.height > 1.9
      ? 1.9 * size.height
      : (size.width ?? 0);

  // Calculate the tick positions and the string labels
  const tickPositions = createTickPositions(minimum, maximum);
  const tickLabels = formatTickLabels(tickPositions);

  const remountKey = useMemo(() => {
    if (!scaledWidth || scaledWidth < 10) return "gauge-init";
    return `gauge-${Math.round(scaledWidth)}`;
  }, [scaledWidth]);

  return (
    <Box
      ref={ref}
      sx={{
        ...style.colors,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%"
      }}
    >
      <GaugeComponent
        key={remountKey}
        style={{
          height: "100%",
          width: `${scaledWidth}px`,
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
          type: "needle",
          color: style?.customColors?.needleColor,
          baseColor: style?.customColors?.needleColor,
          elastic: false,
          animate: true,
          length: 0.95,
          width: 15
        }}
        arc={{
          padding: 0,
          cornerRadius: 0,
          subArcs: buildSubArcs(
            style?.colors?.color as string,
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
              fontFamily: style?.font?.fontFamily,
              fill: style?.colors?.color,
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
                fill: style?.colors?.color,
                fontSize: `${scaledWidth * 0.04}px`,
                textShadow: "none",
                fontFamily: style?.font?.fontFamily
              }
            },
            defaultTickLineConfig: {
              color: style?.colors?.color
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

registerWidget(Meter, MeterWidgetProps, widgetName);
