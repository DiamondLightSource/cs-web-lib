import React, { useContext } from "react";
import { DynamicAction, WidgetActions, executeActions } from "../widgetActions";
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
  FloatPropOpt,
  StringOrNumPropOpt
} from "../propTypes";
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { styled, Button as MuiButton } from "@mui/material";
import { calculateRotationTransform } from "../utils";
import { WIDGET_DEFAULT_SIZES } from "../EmbeddedDisplay/bobParser";
import { useStyle } from "../../themeUtils";

const widgetName = "actionbutton";

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
  height: StringOrNumPropOpt,
  width: StringOrNumPropOpt
};

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

export const ActionButtonComponent = (
  props: InferWidgetProps<typeof ActionButtonPropType> & ActionButtonProps
): JSX.Element => {
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
            display: "flex",
            height: "100%",
            width: "100%",
            wordBreak: "break-word",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "pre-wrap"
          }}
        >
          {props.text || // where there is no text, look for an action description.
            ((
              props.actions?.actions?.find(
                x => (x as DynamicAction)?.dynamicInfo?.description
              ) as DynamicAction
            )?.dynamicInfo?.description ??
              "")}
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

registerWidget(ActionButton, ActionButtonWidgetProps, widgetName);
