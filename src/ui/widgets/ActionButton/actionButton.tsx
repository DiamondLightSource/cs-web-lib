import React, { useContext } from "react";
import {
  WidgetAction,
  WidgetActions,
  executeAction,
  executeActions,
  getActionDescription
} from "../widgetActions";
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
  FloatPropOpt,
  StringOrNumPropOpt
} from "../propTypes";
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { styled, Button as MuiButton } from "@mui/material";
import { calculateRotationTransform } from "../utils";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { useStyle } from "../../hooks/useStyle";

const widgetName = "actionbutton";

const Button = styled(MuiButton)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  minHeight: 0,
  padding: 1,
  overflow: "hidden",
  textTransform: "none",
  whiteSpace: "pre-wrap",
  lineHeight: 1.2,
  "&.Mui-disabled": {
    cursor: "not-allowed"
  }
});

const ActionButtonProps = {
  pvName: StringPropOpt,
  text: StringPropOpt,
  actions: ActionsPropType,
  image: StringPropOpt,
  backgroundColor: ColorPropOpt,
  foregroundColor: ColorPropOpt,
  font: FontPropOpt,
  border: BorderPropOpt,
  visible: BoolPropOpt,
  enabled: BoolPropOpt,
  transparent: BoolPropOpt,
  rotationStep: FloatPropOpt,
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt
};

export type ActionButtonComponentProps = InferWidgetProps<
  typeof ActionButtonProps
> &
  PVComponent;

export const ActionButtonComponent = (
  props: ActionButtonComponentProps
): JSX.Element => {
  // Function to send the value on to the PV
  const files = useContext(FileContext);
  const exitContext = useContext(ExitFileContext);
  const parentMacros = useContext(MacroContext).macros;

  const style = useStyle(
    {
      ...props,
      actions: props?.actions as WidgetActions | undefined
    },
    widgetName
  );

  const {
    enabled = true,
    rotationStep = 0,
    transparent = false,
    visible = true,
    height = WIDGET_DEFAULT_SIZES["action_button"][1],
    width = WIDGET_DEFAULT_SIZES["action_button"][0]
  } = props;

  function onClick(event: React.MouseEvent<HTMLButtonElement>): void {
    // Check if execute all actions as one
    if (props.actions !== undefined)
      if (props.actions.executeAsOne) {
        executeActions(
          props.actions as WidgetActions,
          files,
          exitContext,
          parentMacros
        );
      } else {
        executeAction(
          props.actions.actions[0] as WidgetAction,
          files,
          exitContext,
          parentMacros
        );
      }
  }
  const text =
    props.text === "$(actions)" && props.actions
      ? props.actions.actions.length === 1 && props.actions.actions[0]
        ? getActionDescription(props.actions.actions[0] as WidgetAction)
        : props.actions?.executeAsOne
          ? `${props.actions.actions.length} actions`
          : `Choose 1 of ${props.actions?.actions.length}`
      : "";

  const [inputWidth, inputHeight, transform] = calculateRotationTransform(
    rotationStep,
    width,
    height
  );
  return (
    <Button
      variant={transparent ? "text" : "contained"}
      disabled={!enabled}
      fullWidth={true}
      sx={{
        ...style.colors,
        display: visible ? "flex" : "none",
        height: typeof height === "string" ? "100%" : inputHeight,
        width: typeof width === "string" ? "100%" : inputWidth,
        transform: transform
      }}
      onClick={onClick}
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
            display: "flex",
            height: "100%",
            width: "100%",
            wordBreak: "break-word",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "pre-wrap"
          }}
        >
          {props.text || text}
        </span>
      )}
    </Button>
  );
};

const ActionButtonWidgetProps = {
  ...ActionButtonProps,
  ...PVWidgetPropType
};

export const ActionButton = (
  props: InferWidgetProps<typeof ActionButtonWidgetProps>
): JSX.Element => <Widget baseWidget={ActionButtonComponent} {...props} />;

registerWidget(ActionButton, ActionButtonWidgetProps, widgetName);
