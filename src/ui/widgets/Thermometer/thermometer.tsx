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
import { Color } from "../../../types/color";
import { Box } from "@mui/material";
import { DType } from "../../../types";
import { getPvValueAndName } from "../utils";

// This is the angle between vertical and the line from the center of the bulb to the intersection of the stem and bulb
export const bulbStemAngle = Math.PI / 5;
export const thermometerOutlineWidth = 2;

export const ThermometerComponentProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt,
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

  const {
    pvData,
    limitsFromPv = false,
    height = 160,
    width = 40,
    fillColor = Color.fromRgba(60, 255, 60, 1)
  } = props;
  const { value } = getPvValueAndName(pvData);

  const colors = useMemo(
    () => ({
      mercuryColor: fillColor,
      backgroundColor: Color.fromRgba(230, 230, 230, 1),
      borderColor: Color.fromRgba(75, 75, 75, 1)
    }),
    [fillColor]
  );

  const thermometerDimensions = useMemo(
    () => calculateThermometerDimensions(width, height),
    [width, height]
  );

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    minimum = value.display.controlRange?.min;
    maximum = value.display.controlRange?.max;
  }

  useEffect(() => {
    // Build the thermometer outline.
    const thermometerPath = drawThermometerPathOutline(thermometerDimensions);
    const mercuryBulbPath = drawMercuryBulbPath(thermometerDimensions);

    // Create SVG
    const thermometerSvgGroup = d3
      .select(svgRef.current)
      .attr("width", thermometerDimensions.outerWidth)
      .attr("height", thermometerDimensions.outerHeight);

    // Add the thermometer outline
    thermometerSvgGroup
      .append("path")
      .attr("d", thermometerPath.toString())
      .attr("fill", colors.backgroundColor.toString())
      .attr("stroke", colors.borderColor.toString())
      .style("stroke-width", thermometerOutlineWidth);

    thermometerSvgGroup
      .append("path")
      .attr("d", mercuryBulbPath.toString())
      .attr("fill", colors.mercuryColor.toString());
  }, [thermometerDimensions, colors]);

  useEffect(() => {
    // Fill stem with the correct amount of mercury
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("rect").remove();

    const { mercurySurfaceLevelY, mercuryHeight } = calculateMercuryHeight(
      value,
      minimum,
      maximum,
      thermometerDimensions.verticalStemHeight,
      thermometerDimensions.topOfStemY
    );

    d3.select(svgRef.current)
      .append("rect")
      .attr(
        "x",
        thermometerDimensions.leftSideStemX + thermometerOutlineWidth / 2
      )
      .attr("y", mercurySurfaceLevelY)
      .attr(
        "width",
        2 * thermometerDimensions.stemHalfWidth - thermometerOutlineWidth
      )
      .attr("height", mercuryHeight + thermometerOutlineWidth)
      .attr("fill", colors.mercuryColor.toString());
  }, [value, maximum, minimum, thermometerDimensions, colors]);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "absolute",
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

registerWidget(Thermometer, ThermometerWidgetProps, "thermometer");

export const calculateMercuryHeight = (
  value: DType | undefined,
  minimum: number,
  maximum: number,
  verticalStemHeight: number,
  topOfStemY: number
) => {
  const numValue = value?.getDoubleValue() ?? 0;
  const safeValue = Math.max(minimum, Math.min(maximum, numValue));

  const emptyFractionOfStem = (maximum - safeValue) / (maximum - minimum);
  const mercuryHeight = verticalStemHeight * (1 - emptyFractionOfStem);

  const mercurySurfaceLevelY = Math.round(
    topOfStemY + verticalStemHeight * emptyFractionOfStem
  );
  return { mercurySurfaceLevelY, mercuryHeight };
};
