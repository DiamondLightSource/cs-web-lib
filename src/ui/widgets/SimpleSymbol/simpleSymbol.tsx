import React, { useContext } from "react";

import { Widget } from "../widget";
import { PVWidgetPropType, PVComponent } from "../widgetProps";
import {
  InferWidgetProps,
  BoolPropOpt,
  ColorPropOpt,
  FloatPropOpt,
  BorderPropOpt,
  StringProp,
  FontPropOpt,
  ActionsPropType,
  IntProp
} from "../propTypes";
import { registerWidget } from "../register";
import { executeActions, WidgetActions } from "../widgetActions";
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { useMeasuredSize } from "../../hooks/useMeasuredSize";

const SimpleSymbolProps = {
  imageFile: StringProp,
  imageIndex: IntProp,
  backgroundColor: ColorPropOpt,
  border: BorderPropOpt,
  rotation: FloatPropOpt,
  visible: BoolPropOpt,
  stretchToFit: BoolPropOpt,
  actions: ActionsPropType,
  font: FontPropOpt
};

export type SimpleSymbolComponentProps = InferWidgetProps<
  typeof SimpleSymbolProps
> &
  PVComponent;

/* Simple widget that copies the EdmSymbol widget: use an image file with
   all show the nth segment
   of an image file.
*/
export const SimpleSymbolComponent = (
  props: SimpleSymbolComponentProps
): JSX.Element => {
  const files = useContext(FileContext);
  const exitContext = useContext(ExitFileContext);
  const parentMacros = useContext(MacroContext).macros;
  function onClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (props.actions !== undefined) {
      executeActions(
        props.actions as WidgetActions,
        files,
        exitContext,
        parentMacros
      );
    }
  }
  // Render the imageIndex-th part of the larger png.
  const [ref, size] = useMeasuredSize<HTMLImageElement>(50, 50);

  const left = size.width * props.imageIndex;
  const right = size.width * (props.imageIndex + 1);
  const clip = `rect(0 ${right}px ${size.height}px ${left}px)`;
  const margin = `0 -${left}px 0 -${left}px`;

  return (
    <img
      ref={ref}
      src={props.imageFile}
      alt="Simple symbol widget"
      onClick={onClick}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        position: "absolute",
        clip,
        margin
      }}
    />
  );
};

const SimpleSymbolWidgetProps = {
  ...SimpleSymbolProps,
  ...PVWidgetPropType
};

export const SimpleSymbol = (
  props: InferWidgetProps<typeof SimpleSymbolWidgetProps>
): JSX.Element => <Widget baseWidget={SimpleSymbolComponent} {...props} />;

registerWidget(SimpleSymbol, SimpleSymbolWidgetProps, "pngsymbol");
