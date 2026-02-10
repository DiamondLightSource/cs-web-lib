import React from "react";
import PropTypes from "prop-types";
import Drawer from "@mui/material/Drawer";

import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { registerWidget } from "../register";
import {
  InferWidgetProps,
  ChoicePropOpt,
  StringOrNumPropOpt,
  FontPropOpt,
  StringPropOpt,
  ColorPropOpt,
  BorderPropOpt
} from "../propTypes";
import { borderToCss } from "../../../types/border";
import { fontToCss } from "../../../types/font";

export const DrawerProps = {
  anchor: ChoicePropOpt(["left", "right", "top", "bottom"]),
  drawerWidth: StringOrNumPropOpt,
  drawerMaxWidth: StringOrNumPropOpt,
  font: FontPropOpt,
  foregroundColor: ColorPropOpt,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  text: StringPropOpt,
  children: PropTypes.arrayOf(PropTypes.element)
};

export const DrawerComponent = (
  props: InferWidgetProps<typeof DrawerProps>
): JSX.Element => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // To satisfy the typing for the literals
  type anchorType = "left" | "right" | "top" | "bottom";

  return (
    <React.Fragment>
      <button
        onClick={(): void => setDrawerOpen(true)}
        style={{
          height: "100%",
          width: "100%",
          ...fontToCss(props.font),
          ...borderToCss(props.border),
          color: props.foregroundColor?.colorString,
          backgroundColor: props.backgroundColor?.colorString
        }}
      >
        {props.text ?? "\u2630"}
      </button>
      <Drawer
        anchor={(props.anchor ?? "left") as anchorType}
        open={drawerOpen}
        onClose={(): void => setDrawerOpen(false)}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            width: props.drawerWidth ?? "80vw",
            maxWidth: props.drawerMaxWidth ?? "400px"
          }}
        >
          {props.children}
        </div>
      </Drawer>
    </React.Fragment>
  );
};

export const DrawerWidgetProps = {
  ...DrawerProps,
  ...WidgetPropType
};

export const DrawerWidget = (
  props: InferWidgetProps<typeof DrawerWidgetProps>
): JSX.Element => <Widget baseWidget={DrawerComponent} {...props} />;

registerWidget(DrawerWidget, DrawerWidgetProps, "drawer");
