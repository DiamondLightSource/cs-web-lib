import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

import { Widget } from "../widget";
import { PVInputComponent, PVWidgetPropType } from "../widgetProps";
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

// This is the angle between vertical and the line from the center of the bulb to the intersection of the stem and bulb
export const bulbStemAngle = Math.PI / 5;
export const themometerOutlineWidth = 2;

export const ThermometerComponentProps = {
  minimum: FloatPropOpt,
  maximum: FloatPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt,
  limitsFromPv: BoolPropOpt,
  fillColor: ColorPropOpt
};

interface ThermomemterDimensions {
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
  props: InferWidgetProps<typeof ThermometerComponentProps> & PVInputComponent
): JSX.Element => {
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    value,
    limitsFromPv = false,
    height = 160,
    width = 40,
    fillColor = Color.fromRgba(60, 255, 60, 1)
  } = props;

  const colors = useMemo(
    () => ({
      mercuryColor: fillColor,
      backgroundColor: Color.fromRgba(230, 230, 230, 1),
      borderColor: Color.fromRgba(75, 75, 75, 1)
    }),
    [fillColor]
  );

  const themometerDimensions = useMemo(
    () => calculateThemometerDimensions(width, height),
    [width, height]
  );

  let { minimum = 0, maximum = 100 } = props;
  if (limitsFromPv && value?.display.controlRange) {
    minimum = value.display.controlRange?.min;
    maximum = value.display.controlRange?.max;
  }

  useEffect(() => {
    // Build the thermometer outline.
    const thermometerPath = drawThermometerPathOutline(themometerDimensions);
    const mercuryBulbPath = drawMercuryBulbPath(themometerDimensions);

    // Create SVG
    const thermometerSvgGroup = d3
      .select(svgRef.current)
      .attr("width", themometerDimensions.outerWidth)
      .attr("height", themometerDimensions.outerHeight);

    // Add the thermometer outline
    thermometerSvgGroup
      .append("path")
      .attr("d", thermometerPath.toString())
      .attr("fill", colors.backgroundColor.toString())
      .attr("stroke", colors.borderColor.toString())
      .style("stroke-width", themometerOutlineWidth);

    thermometerSvgGroup
      .append("path")
      .attr("d", mercuryBulbPath.toString())
      .attr("fill", colors.mercuryColor.toString());
  }, [themometerDimensions, colors]);

  useEffect(() => {
    // Fill stem with the correct amount of mercury
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("rect").remove();

    const { mercurySurfaceLevelY, mercuryHeight } = calculateMercuryHeight(
      value,
      minimum,
      maximum,
      themometerDimensions.verticalStemHeight,
      themometerDimensions.topOfStemY
    );

    d3.select(svgRef.current)
      .append("rect")
      .attr(
        "x",
        themometerDimensions.leftSideStemX + themometerOutlineWidth / 2
      )
      .attr("y", mercurySurfaceLevelY)
      .attr(
        "width",
        2 * themometerDimensions.stemHalfWidth - themometerOutlineWidth
      )
      .attr("height", mercuryHeight + themometerOutlineWidth)
      .attr("fill", colors.mercuryColor.toString());
  }, [value, maximum, minimum, themometerDimensions, colors]);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "absolute",
        border: 1,
        borderColor: "#D2D2D2",
        borderRadius: "4px",
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
  themometerDimensions: ThermomemterDimensions
) => {
  const thermometerPath = d3.path();

  // Start at the top-left of the tube
  thermometerPath.moveTo(
    themometerDimensions.leftSideStemX,
    themometerDimensions.topOfStemY
  );

  // Draw semi-circular top of the stem
  thermometerPath.arcTo(
    themometerDimensions.leftSideStemX,
    themometerDimensions.topOfStemY - themometerDimensions.stemHalfWidth,
    themometerDimensions.bulbCenterX,
    themometerDimensions.topOfStemY - themometerDimensions.stemHalfWidth,
    themometerDimensions.stemHalfWidth
  );
  thermometerPath.arcTo(
    themometerDimensions.rightSideStemX,
    themometerDimensions.topOfStemY - themometerDimensions.stemHalfWidth,
    themometerDimensions.rightSideStemX,
    themometerDimensions.topOfStemY,
    themometerDimensions.stemHalfWidth
  );

  // Draw right side of stem
  thermometerPath.lineTo(
    themometerDimensions.rightSideStemX,
    themometerDimensions.bottomOfStemY
  );

  // Draw the bulb outline. Rotate angle by pi/2, to make relative to horizontal axis, rather than vertical.
  thermometerPath.arc(
    themometerDimensions.bulbCenterX,
    themometerDimensions.bulbCenterY,
    themometerDimensions.bulbRadius,
    bulbStemAngle - Math.PI / 2,
    -bulbStemAngle - Math.PI / 2,
    false
  );

  thermometerPath.closePath();
  return thermometerPath;
};

const drawMercuryBulbPath = (themometerDimensions: ThermomemterDimensions) => {
  // very similar to the thermometer outline bulb, but corrected for half the width of the thermomemter outline.
  const mercuryBulbPath = d3.path();

  const bulbTopRightX =
    themometerDimensions.rightSideStemX -
    themometerOutlineWidth * 0.5 * Math.cos(bulbStemAngle);
  const bulbTopRightY =
    themometerDimensions.bottomOfStemY +
    themometerOutlineWidth * 0.5 * Math.sin(bulbStemAngle);

  mercuryBulbPath.moveTo(bulbTopRightX, bulbTopRightY);

  // Draw the bulb outline
  mercuryBulbPath.arc(
    themometerDimensions.bulbCenterX,
    themometerDimensions.bulbCenterY,
    themometerDimensions.bulbRadius - themometerOutlineWidth * 0.5,
    bulbStemAngle - Math.PI / 2,
    -bulbStemAngle - Math.PI / 2,
    false
  );

  mercuryBulbPath.closePath();
  return mercuryBulbPath;
};

export const calculateThemometerDimensions = (
  width: number,
  height: number
): ThermomemterDimensions => {
  // allow padding around the thermometer
  const innerWidth = width - themometerOutlineWidth;
  const innerHeight = height - themometerOutlineWidth - 2;

  // Stem half width is minimum of 10 or a quarter of the innerWidth
  const stemHalfWidth = Math.min(10, innerWidth * 0.25);
  // vertical displacement of the bulb center from the bulb and stem intersection
  const bulbUpperHeight = stemHalfWidth / Math.cos(bulbStemAngle);
  const bulbRadius = stemHalfWidth / Math.sin(bulbStemAngle);
  const bulbCenterX = width * 0.5;

  const verticalStemHeight =
    innerHeight - stemHalfWidth - bulbRadius - bulbUpperHeight;
  const topOfStemY = stemHalfWidth + 1 + 0.5 * themometerOutlineWidth;

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
