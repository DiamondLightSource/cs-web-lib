import React from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  MacrosPropOpt
} from "../propTypes";
import classes from "./arc.module.css";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { useStyle } from "../../hooks/useStyle";
import { calculateArc } from "./arcUtils";
import { useMeasuredSize } from "../../hooks/useMeasuredSize";

const widgetName = "arc";

const ArcProps = {
  macros: MacrosPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  fill: BoolPropOpt,
  startAngle: IntPropOpt,
  totalAngle: IntPropOpt,
  lineWidth: IntPropOpt,
  lineColor: ColorPropOpt,
  transparent: BoolPropOpt
};

export const ArcComponent = (
  props: InferWidgetProps<typeof ArcProps>
): JSX.Element => {
  // CSS uses "Fill", Phoebus uses "transparent"
  const transparent =
    props.transparent ?? (props.fill != null ? !props.fill : false);

  // CSS uses "Foreground Color", Phoebus uses "Line Color"
  const style = useStyle(
    {
      ...props,
      foregroundColor: props?.lineColor ?? props?.foregroundColor,
      transparent
    },
    widgetName
  );

  const { startAngle = 0, totalAngle = 90, lineWidth = 3 } = props;

  const [ref, size] = useMeasuredSize<SVGSVGElement>(
    WIDGET_DEFAULT_SIZES["arc"][0],
    WIDGET_DEFAULT_SIZES["arc"][1]
  );

  const [arc, edge] = calculateArc(
    size.width,
    size.height,
    startAngle,
    totalAngle,
    lineWidth
  );

  // Combine edge if not full circle or filled
  const shape = transparent || totalAngle === 360 ? arc : arc.concat(edge);

  const element = (
    <path
      className={classes.Arc}
      d={shape}
      stroke={style?.colors?.color}
      fill={style?.colors?.backgroundColor}
      key={`test`}
      strokeWidth={lineWidth}
    ></path>
  );

  return (
    <svg
      ref={ref}
      width="100%"
      height="100%"
      viewBox={`0 0 ${size.width} ${size.height}`}
      overflow={"visible"}
    >
      {element}
    </svg>
  );
};

const ArcWidgetProps = {
  ...ArcProps,
  ...WidgetPropType
};

export const Arc = (
  props: InferWidgetProps<typeof ArcWidgetProps>
): JSX.Element => <Widget baseWidget={ArcComponent} {...props} />;

registerWidget(Arc, ArcWidgetProps, widgetName);
