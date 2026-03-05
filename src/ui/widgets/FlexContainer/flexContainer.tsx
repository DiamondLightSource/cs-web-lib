import React from "react";

import classes from "./flexContainer.module.css";
import { Widget } from "../widget";
import { useStyle } from "../../hooks/useStyle";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  ChildrenPropOpt,
  ChoicePropOpt,
  InferWidgetProps,
  BorderPropOpt,
  ColorPropOpt
} from "../propTypes";

const widgetName = "flexcontainer";

const FlexProps = {
  flexFlow: ChoicePropOpt(["rowWrap", "column", "row", "columnWrap"]),
  justifyContent: ChoicePropOpt([
    "space-around",
    "center",
    "flex-start",
    "flex-end"
  ]),
  children: ChildrenPropOpt,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt
};

export const FlexContainerComponent = (
  props: InferWidgetProps<typeof FlexProps>
): JSX.Element => {
  const { flexFlow = undefined, justifyContent = undefined } = props;
  const style = useStyle(props, widgetName);
  const fullStyle = {
    ...style.colors,
    ...style.font,
    ...style.border,
    ...style.other,
    flexFlow,
    justifyContent
  };
  return (
    <div className={classes.FlexContainer} style={fullStyle}>
      <>{props.children}</>
    </div>
  );
};

const FlexWidgetProps = {
  ...FlexProps,
  ...WidgetPropType
};

export const FlexContainer = (
  props: InferWidgetProps<typeof FlexWidgetProps>
): JSX.Element => <Widget baseWidget={FlexContainerComponent} {...props} />;

registerWidget(FlexContainer, FlexWidgetProps, widgetName);
