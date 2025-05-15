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
  FuncPropOpt,
  FloatPropOpt
} from "../propTypes";
import { Color } from "../../../types/color";
import { Font } from "../../../types/font";
import { Border } from "../../../types/border";
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { styled, Button as MuiButton, useTheme } from "@mui/material";

export interface ActionButtonProps {
  text: string;
  enabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  image?: string;
  backgroundColor?: Color;
  foregroundColor?: Color;
  border?: Border;
  font?: Font;
  actions?: WidgetActions;
  visible?: boolean;
  rotationStep?: number;
  transparent?: boolean;
}

const Button = styled(MuiButton)({
  "&.MuiButton-root": {
    display: "block",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    minWidth: 0,
    minHeight: 0,
    padding: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    wordBreak: "break-word",
    textTransform: "none"
  },
  "&.Mui-disabled": {
    cursor: "not-allowed",
    pointerEvents: "all !important"
  }
});

export const ActionButtonComponent = (
  props: ActionButtonProps
): JSX.Element => {
  const theme = useTheme();
  const {
    enabled = true,
    foregroundColor = theme.palette.primary.contrastText,
    rotationStep = 0,
    transparent = false
  } = props;

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? theme.palette.primary.main);
  const font = props.font?.css() ?? theme.typography;
  const border = props.border?.css() ?? null;

  return (
    <Button
      variant={transparent ? "text" : "contained"}
      disabled={!enabled}
      fullWidth={true}
      sx={{
        color: foregroundColor.toString(),
        backgroundColor: backgroundColor,
        border: border,
        fontFamily: font
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
        <span
          style={{
            display: "block",
            lineHeight: 1,
            transform: `rotate(${rotationStep * -90}deg)`
          }}
        >
          {props.text ?? ""}
        </span>
      )}
    </Button>
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
  enabled: BoolPropOpt,
  onClick: FuncPropOpt,
  transparent: BoolPropOpt,
  rotationStep: FloatPropOpt
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
      enabled={props.enabled}
      onClick={onClick}
      image={props.image}
      backgroundColor={props.backgroundColor}
      foregroundColor={props.foregroundColor}
      font={props.font}
      border={props.border}
      actions={props.actions as WidgetActions}
      visible={props.visible}
      transparent={props.transparent}
      rotationStep={props.rotationStep}
    />
  );
};

export const ActionButton = (
  props: InferWidgetProps<typeof ActionButtonWidgetProps>
): JSX.Element => <Widget baseWidget={ActionButtonWidget} {...props} />;

registerWidget(ActionButton, ActionButtonWidgetProps, "actionbutton");
