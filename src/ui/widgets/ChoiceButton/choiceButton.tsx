import React, { CSSProperties, useEffect, useState } from "react";

import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  BoolPropOpt,
  ColorPropOpt,
  FontPropOpt,
  InferWidgetProps,
  IntPropOpt,
  StringArrayPropOpt,
  StringPropOpt
} from "../propTypes";
import { DType } from "../../../types/dtypes";
import classes from "./choiceButton.module.css";
import { Color } from "../../../types/color";
import { writePv } from "../../hooks/useSubscription";
import { Font } from "../../../types/font";

const ChoiceButtonProps = {
  pvName: StringPropOpt,
  height: IntPropOpt,
  width: IntPropOpt,
  items: StringArrayPropOpt,
  selectedColor: ColorPropOpt,
  itemsFromPv: BoolPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  horizontal: BoolPropOpt,
  enabled: BoolPropOpt,
  itemsfromPv: BoolPropOpt,
  font: FontPropOpt
};

export type ChoiceButtonComponentProps = InferWidgetProps<
  typeof ChoiceButtonProps
> &
  PVComponent;

export const ChoiceButtonComponent = (
  props: ChoiceButtonComponentProps
): JSX.Element => {
  const {
    width = 100,
    height = 43,
    value = null,
    enabled = true,
    itemsFromPv = true,
    pvName,
    items = ["Item 1", "Item 2"],
    horizontal = true,
    backgroundColor = Color.fromRgba(210, 210, 210),
    foregroundColor = Color.BLACK,
    selectedColor = Color.fromRgba(200, 200, 200),
    font = new Font(14)
  } = props;
  const [selected, setSelected] = useState(value?.getDoubleValue());

  // Use items from file, unless itemsFRomPv set
  let options = items;
  if (itemsFromPv && value?.display.choices) options = value?.display.choices;

  // This is necessary in order to set the initial label value
  // after connection to PV established, as setState cannot be
  // established inside a conditional, or called in the main body
  // of the component as it causes too many re-renders error
  useEffect(() => {
    if (value) {
      setSelected(value.getDoubleValue());
    }
  }, [value]);

  // Number of buttons to create
  const numButtons = options.length || 1;
  // Determine width and height of buttons if horizontal or vertically placed
  const buttonHeight = horizontal ? height : height / numButtons - 4;
  const buttonWidth = horizontal ? width / numButtons - 4 : width;

  const style: CSSProperties = {
    height: buttonHeight,
    width: buttonWidth,
    textAlignLast: "center",
    cursor: enabled ? "default" : "not-allowed",
    color: foregroundColor?.toString(),
    ...font.css()
  };

  function handleClick(index: number) {
    // Write to PV
    if (pvName) {
      writePv(pvName, new DType({ doubleValue: index }));
    }
  }

  // Iterate over items to create buttons
  const elements: Array<JSX.Element> = [];
  options.forEach((item: string | null | undefined, idx: number) => {
    if (typeof item === "string") {
      elements.push(
        <button
          className={classes.ChoiceButton}
          disabled={enabled ? false : true}
          onClick={() => handleClick(idx)}
          style={{
            ...style,
            backgroundColor:
              selected === idx
                ? selectedColor.toString()
                : backgroundColor.toString(),
            boxShadow:
              selected === idx
                ? `inset 0px ${Math.round(height / 6)}px ${Math.round(
                  height / 4
                )}px 0px rgba(0,0,0,0.3)`
                : "none"
          }}
          key={item}
        >
          {item}
        </button>
      );
    }
  });

  return (
    <div
      style={{ display: "flex", flexDirection: horizontal ? "row" : "column" }}
    >
      {elements}
    </div>
  );
};

const ChoiceButtonWidgetProps = {
  ...ChoiceButtonProps,
  ...PVWidgetPropType
};

export const ChoiceButton = (
  props: InferWidgetProps<typeof ChoiceButtonWidgetProps>
): JSX.Element => <Widget baseWidget={ChoiceButtonComponent} {...props} />;

registerWidget(ChoiceButton, ChoiceButtonWidgetProps, "choicebutton");
