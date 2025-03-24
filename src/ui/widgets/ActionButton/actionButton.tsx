import React, { useContext } from "react";
import { WidgetActions, executeActions } from "../widgetActions";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import classes from "./actionButton.module.css";
import { registerWidget } from "../register";
import {
  ActionsPropType,
  StringPropOpt,
  InferWidgetProps,
  ColorPropOpt,
  FontPropOpt,
  BorderPropOpt,
  BoolPropOpt,
  FuncPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import { Font } from "../../../types/font";
import { Border } from "../../../types/border";
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { Button, ThemeProvider } from "@mui/material";

import { defaultColours } from "../../../colourscheme";

export interface ActionButtonProps {
  text: string;
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  image?: string;
  backgroundColor?: Color;
  foregroundColor?: Color;
  border?: Border;
  font?: Font;
  actions?: WidgetActions;
  visible?: boolean;
}

export const ActionButtonComponent = (
  props: ActionButtonProps
): JSX.Element => {
  return (
    <ThemeProvider theme={defaultColours}>
      <Button
        variant="contained"
        disabled={props.disabled}
        sx={{
          height: "100%",
          width: "100%",
          fontFamily: props.font?.css() ?? "",
          color:
            props.foregroundColor?.toString() ??
            defaultColours.palette.primary.contrastText,
          backgroundColor:
            props.backgroundColor?.toString() ??
            defaultColours.palette.primary.main,
          border: props.border?.css() ?? ""
        }}
        onClick={props.onClick}
      >
        {props.image !== undefined ? (
          <figure className={classes.figure}>
            <img
              style={{ width: "100%", display: "block" }}
              src={props.image}
              alt={props.image}
            ></img>
            <figcaption>{props.text}</figcaption>
          </figure>
        ) : (
          (props.text ?? "")
        )}
      </Button>
    </ThemeProvider>
  );
};

const ActionButtonPropType = {
  text: StringPropOpt,
  actions: ActionsPropType,
  image: StringPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  visible: BoolPropOpt,
  disabled: BoolPropOpt,
  onClick: FuncPropOpt
};

const ActionButtonWidgetProps = {
  ...ActionButtonPropType,
  ...PVWidgetPropType
};

// Menu button which also knows how to write to a PV
export const ActionButtonWidget = (
  props: InferWidgetProps<typeof ActionButtonWidgetProps> & PVComponent
): JSX.Element => {
  // Function to send the value on to the PV
  const files = useContext(FileContext);
  const exitContext = useContext(ExitFileContext);
  const parentMacros = useContext(MacroContext).macros;
  function onClick(event: React.MouseEvent<HTMLButtonElement>): void {
    if (props.actions !== undefined)
      executeActions(
        props.actions as WidgetActions,
        files,
        exitContext,
        parentMacros
      );
  }
  return (
    <ActionButtonComponent
      text={props.text ?? ""}
      disabled={props.readonly}
      onClick={onClick}
      image={props.image}
      backgroundColor={props.backgroundColor}
      foregroundColor={props.foregroundColor}
      font={props.font}
      border={props.border}
      actions={props.actions as WidgetActions}
      visible={props.visible}
    />
  );
};

export const ActionButton = (
  props: InferWidgetProps<typeof ActionButtonWidgetProps>
): JSX.Element => <Widget baseWidget={ActionButtonWidget} {...props} />;

registerWidget(ActionButton, ActionButtonWidgetProps, "actionbutton");
