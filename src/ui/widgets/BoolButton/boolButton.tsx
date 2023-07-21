import React, { useEffect, useState, CSSProperties } from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ColorPropOpt,
  IntPropOpt,
  PointsPropOpt,
  BoolPropOpt,
  StringPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";

const BoolButtonProps = {
  height: IntPropOpt,
  width: IntPropOpt,
  onState: IntPropOpt,
  offState: IntPropOpt,
  onColor: ColorPropOpt,
  offColor: ColorPropOpt,
  onLabel: StringPropOpt,
  offLabel: StringPropOpt,
  squareButton: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  points: PointsPropOpt,
  rotationAngle: IntPropOpt,
  effect3d: BoolPropOpt,
  showBoolean: BoolPropOpt,
  confirmMessage: StringPropOpt
};

export type BoolButtonComponentProps = InferWidgetProps<
  typeof BoolButtonProps
> &
  PVComponent;

/**
 * Button that displays boolean value, and changes when clicked.
 * Currently no write to PV so value does not change, only button
 * appearance does
 * @param props
 */
export const BoolButtonComponent = (
  props: BoolButtonComponentProps
): JSX.Element => {
  const {
    value,
    width = 100,
    height = 50,
    onState,
    offState,
    onColor = Color.fromRgba(0, 255, 0),
    offColor = Color.fromRgba(0, 100, 0),
    onLabel = "ON",
    offLabel = "OFF",
    squareButton = false,
    backgroundColor = Color.fromRgba(200, 200, 200),
    foregroundColor = Color.fromRgba(0, 0, 0),
    showBoolean = true
  } = props;

  // Use useState for properties that change on click - text and color
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(backgroundColor.toString());
  const doubleValue = value?.getDoubleValue();

  // Establish style
  const style: CSSProperties = {
    width: width,
    height: height,
    backgroundColor: color, // This is changed by state
    color: foregroundColor.toString()
  };
  if (!squareButton) style["borderRadius"] = "50%";

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (doubleValue !== undefined && showBoolean) {
      if (doubleValue === onState) {
        setLabel(onLabel);
        setColor(onColor.toString());
      } else if (doubleValue === offState) {
        setLabel(offLabel);
        setColor(offColor.toString());
      }
    }
  }, [
    doubleValue,
    onState,
    onLabel,
    onColor,
    offState,
    offLabel,
    offColor,
    showBoolean
  ]);

  // TO DO - currently we check existing value and change label. When
  // we have PV write ability, change value and label
  // TO DO - extra features such as show led and confirmation modal?...
  function handleClick(e: React.MouseEvent) {
    if (showBoolean) {
      if ((e.target as HTMLButtonElement).innerHTML === onLabel) {
        setLabel(offLabel);
        setColor(offColor.toString());
      } else if ((e.target as HTMLButtonElement).innerHTML === offLabel) {
        setLabel(onLabel);
        setColor(onColor.toString());
      }
    }
  }

  return (
    <button style={style} onClick={event => handleClick(event)}>
      {label}
    </button>
  );
};

const BoolButtonWidgetProps = {
  ...BoolButtonProps,
  ...PVWidgetPropType
};

export const BoolButton = (
  props: InferWidgetProps<typeof BoolButtonWidgetProps>
): JSX.Element => <Widget baseWidget={BoolButtonComponent} {...props} />;

registerWidget(BoolButton, BoolButtonWidgetProps, "boolbutton");
