import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  FloatPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  ColorPropOpt
} from "../propTypes";
import { Box } from "@mui/material";
import { getPvValueAndName } from "../utils";
import { dTypeGetDoubleValue, DType } from "../../../types/dtypes";
import { useStyle } from "../../hooks/useStyle";
import { useMeasuredSize } from "../../hooks/useMeasuredSize";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

const widgetName = "thermometer";

// This is the angle between vertical and the line from the center of the bulb to the intersection of the stem and bulb
export const bulbStemAngle = Math.PI / 5;
export const thermometerOutlineWidth = 2;

export const ThermometerComponentProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  fillColor: ColorPropOpt
};

interface ThermometerDimensions {
  outerWidth: number;
  outerHeight: number;
  bulbCenterX: number;
  bulbCenterY: number;
  stemHalfWidth: number;
  verticalStemHeight: number;
  topOfStemY: number;
  bottomOfStemY: number;
  leftSideStemX: number;
  rightSideStemX: number;
  bulbRadius: number;
}

export const ThermometerComponent = (
  props: InferWidgetProps<typeof ThermometerComponentProps> & PVComponent
): JSX.Element => {
  const svgRef = useRef<SVGSVGElement>(null);
  const style = useStyle({ foregroundColor: props.fillColor }, widgetName);

  const { pvData, limitsFromPv = false } = props;
  const { value } = getPvValueAndName(pvData);

  const colors = useMemo(
    () => ({
      mercuryColor: style?.colors?.color,
      backgroundColor: style?.colors?.backgroundColor,
      borderColor: style?.border?.borderColor
    }),
    [
      style?.colors?.color,
      style?.colors?.backgroundColor,
      style?.border?.borderColor
    ]
  );

  const [ref, size] = useMeasuredSize(
    WIDGET_DEFAULT_SIZES[widgetName][0],
    WIDGET_DEFAULT_SIZES[widgetName][1]
  );

  const thermometerDimensions = useMemo(
    () => calculateThermometerDimensions(size.width, size.height),
    [size]
  );

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    minimum = value.display.controlRange?.min;
    maximum = value.display.controlRange?.max;
  }

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    svg.append("path").attr("class", "thermo-outline");
    svg.append("path").attr("class", "thermo-bulb");
    svg.append("rect").attr("class", "thermo-mercury");
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const dims = thermometerDimensions;
    const svg = d3
      .select(svgRef.current)
      .attr("width", dims.outerWidth)
      .attr("height", dims.outerHeight);

    svg
      .select(".thermo-outline")
      .attr("d", drawThermometerPathOutline(dims).toString())
      .attr("fill", colors.backgroundColor as string)
      .attr("stroke", colors.borderColor as string)
      .style("stroke-width", thermometerOutlineWidth);

    svg
      .select(".thermo-bulb")
      .attr("d", drawMercuryBulbPath(dims).toString())
      .attr("fill", colors.mercuryColor as string);
  }, [thermometerDimensions, colors]);

  useEffect(() => {
    if (!svgRef.current) return;

    const dims = thermometerDimensions;
    const svg = d3.select(svgRef.current);

    const { mercurySurfaceLevelY, mercuryHeight } = calculateMercuryHeight(
      value,
      minimum,
      maximum,
      dims.verticalStemHeight,
      dims.topOfStemY
    );

    svg
      .select(".thermo-mercury")
      .attr("x", dims.leftSideStemX + thermometerOutlineWidth / 2)
      .attr("y", mercurySurfaceLevelY)
      .attr("width", 2 * dims.stemHalfWidth - thermometerOutlineWidth)
      .attr("height", mercuryHeight + thermometerOutlineWidth)
      .attr("fill", colors.mercuryColor as string);
  }, [value, minimum, maximum, thermometerDimensions, colors]);

  return (
    <Box
      ref={ref}
      sx={{
        height: "100%",
        width: "100%",
        backgroundColor: "transparent"
      }}
    >
      <svg ref={svgRef} />
    </Box>
  );
};

const ThermometerWidgetProps = {
  ...ThermometerComponentProps,
  ...PVWidgetPropType
};

const drawThermometerPathOutline = (
  thermometerDimensions: ThermometerDimensions
) => {
  const thermometerPath = d3.path();

  // Start at the top-left of the tube
  thermometerPath.moveTo(
    thermometerDimensions.leftSideStemX,
    thermometerDimensions.topOfStemY
  );

  // Draw semi-circular top of the stem
  thermometerPath.arcTo(
    thermometerDimensions.leftSideStemX,
    thermometerDimensions.topOfStemY - thermometerDimensions.stemHalfWidth,
    thermometerDimensions.bulbCenterX,
    thermometerDimensions.topOfStemY - thermometerDimensions.stemHalfWidth,
    thermometerDimensions.stemHalfWidth
  );
  thermometerPath.arcTo(
    thermometerDimensions.rightSideStemX,
    thermometerDimensions.topOfStemY - thermometerDimensions.stemHalfWidth,
    thermometerDimensions.rightSideStemX,
    thermometerDimensions.topOfStemY,
    thermometerDimensions.stemHalfWidth
  );

  // Draw right side of stem
  thermometerPath.lineTo(
    thermometerDimensions.rightSideStemX,
    thermometerDimensions.bottomOfStemY
  );

  // Draw the bulb outline. Rotate angle by pi/2, to make relative to horizontal axis, rather than vertical.
  thermometerPath.arc(
    thermometerDimensions.bulbCenterX,
    thermometerDimensions.bulbCenterY,
    thermometerDimensions.bulbRadius,
    bulbStemAngle - Math.PI / 2,
    -bulbStemAngle - Math.PI / 2,
    false
  );

  thermometerPath.closePath();
  return thermometerPath;
};

const drawMercuryBulbPath = (thermometerDimensions: ThermometerDimensions) => {
  // very similar to the thermometer outline bulb, but corrected for half the width of the thermometer outline.
  const mercuryBulbPath = d3.path();

  const bulbTopRightX =
    thermometerDimensions.rightSideStemX -
    thermometerOutlineWidth * 0.5 * Math.cos(bulbStemAngle);
  const bulbTopRightY =
    thermometerDimensions.bottomOfStemY +
    thermometerOutlineWidth * 0.5 * Math.sin(bulbStemAngle);

  mercuryBulbPath.moveTo(bulbTopRightX, bulbTopRightY);

  // Draw the bulb outline
  mercuryBulbPath.arc(
    thermometerDimensions.bulbCenterX,
    thermometerDimensions.bulbCenterY,
    thermometerDimensions.bulbRadius - thermometerOutlineWidth * 0.5,
    bulbStemAngle - Math.PI / 2,
    -bulbStemAngle - Math.PI / 2,
    false
  );

  mercuryBulbPath.closePath();
  return mercuryBulbPath;
};

export const calculateThermometerDimensions = (
  width: number,
  height: number
): ThermometerDimensions => {
  // allow padding around the thermometer
  const innerWidth = width - thermometerOutlineWidth;
  const innerHeight = height - thermometerOutlineWidth - 2;

  // Stem half width is minimum of 10 or a quarter of the innerWidth
  const stemHalfWidth = Math.min(10, innerWidth * 0.25);
  // vertical displacement of the bulb center from the bulb and stem intersection
  const bulbUpperHeight = stemHalfWidth / Math.cos(bulbStemAngle);
  const bulbRadius = stemHalfWidth / Math.sin(bulbStemAngle);
  const bulbCenterX = width * 0.5;

  const verticalStemHeight =
    innerHeight - stemHalfWidth - bulbRadius - bulbUpperHeight;
  const topOfStemY = stemHalfWidth + 1 + 0.5 * thermometerOutlineWidth;

  return {
    outerHeight: height,
    outerWidth: width,
    stemHalfWidth,
    bulbCenterX,
    bulbCenterY: topOfStemY + verticalStemHeight + bulbUpperHeight,
    bulbRadius,
    verticalStemHeight,
    topOfStemY,
    bottomOfStemY: topOfStemY + verticalStemHeight,
    leftSideStemX: bulbCenterX - stemHalfWidth,
    rightSideStemX: bulbCenterX + stemHalfWidth
  };
};

export const Thermometer = (
  props: InferWidgetProps<typeof ThermometerWidgetProps>
): JSX.Element => <Widget baseWidget={ThermometerComponent} {...props} />;

registerWidget(Thermometer, ThermometerWidgetProps, widgetName);

export const calculateMercuryHeight = (
  value: DType | undefined,
  minimum: number,
  maximum: number,
  verticalStemHeight: number,
  topOfStemY: number
) => {
  const numValue = dTypeGetDoubleValue(value) ?? 0;
  const safeValue = Math.max(minimum, Math.min(maximum, numValue));

  const emptyFractionOfStem = (maximum - safeValue) / (maximum - minimum);
  const mercuryHeight = verticalStemHeight * (1 - emptyFractionOfStem);

  const mercurySurfaceLevelY = Math.round(
    topOfStemY + verticalStemHeight * emptyFractionOfStem
  );
  return { mercurySurfaceLevelY, mercuryHeight };
};
