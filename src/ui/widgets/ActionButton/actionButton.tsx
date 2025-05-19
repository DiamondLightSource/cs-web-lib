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
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { styled, Button as MuiButton } from "@mui/material";

import { diamondTheme } from "../../../diamondTheme";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";

export interface ActionButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

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
  rotationStep: FloatPropOpt,
  height: FloatPropOpt,
  width: FloatPropOpt
};

const Button = styled(MuiButton)({
  "&.MuiButton-root": {
    display: "block",
    alignItems: "center",
    justifyContent: "center",
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
  props: InferWidgetProps<typeof ActionButtonPropType> & ActionButtonProps
): JSX.Element => {
  const {
    enabled = true,
    foregroundColor = diamondTheme.palette.primary.contrastText,
    rotationStep = 0,
    transparent = false,
    height = WIDGET_DEFAULT_SIZES["action_button"][1],
    width = WIDGET_DEFAULT_SIZES["action_button"][0]
  } = props;

  const backgroundColor = transparent
    ? "transparent"
    : (props.backgroundColor?.toString() ?? diamondTheme.palette.primary.main);
  const font = props.font?.css() ?? diamondTheme.typography;
  const border = props.border?.css() ?? null;

  const inputWidth = rotationStep === 0 || rotationStep === 2 ? width : height;
  const inputHeight = rotationStep === 0 || rotationStep === 2 ? height : width;

  const offset = width / 2 - height / 2;
  const transform = (function () {
    switch (rotationStep) {
      case 0: // 0 degrees
      case 2: // 180 degrees
        return `rotate(${rotationStep * -90}deg)`;
      case 1: // 90 degrees
        return `rotate(${rotationStep * -90}deg) translateY(${offset}px) translateX(${offset}px)`;
      case 3: // -90 degrees
        return `rotate(${rotationStep * -90}deg) translateY(${-offset}px) translateX(${-offset}px)`;
      default: // Unreachable
        return "";
    }
  })();

  return (
    <Button
      variant={transparent ? "text" : "contained"}
      disabled={!enabled}
      fullWidth={true}
      sx={{
        "&.MuiButton-root": {
          height: inputHeight,
          width: inputWidth
        },
        color: foregroundColor.toString(),
        backgroundColor: backgroundColor,
        border: border,
        fontFamily: font,
        transform: transform.toString()
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
            lineHeight: 1
          }}
        >
          {props.text ?? ""}
        </span>
      )}
    </Button>
  );
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
      height={props.height}
      width={props.width}
    />
  );
};

export const ActionButton = (
  props: InferWidgetProps<typeof ActionButtonWidgetProps>
): JSX.Element => <Widget baseWidget={ActionButtonWidget} {...props} />;

registerWidget(ActionButton, ActionButtonWidgetProps, "actionbutton");
