import React, { useContext } from "react";

import { commonCss, Widget } from "../widget";
import { PVWidgetPropType, PVComponent } from "../widgetProps";
import {
  InferWidgetProps,
  BoolPropOpt,
  StringPropOpt,
  ColorPropOpt,
  FloatPropOpt,
  BorderPropOpt,
  ChoicePropOpt,
  FontPropOpt,
  ActionsPropType,
  StringArrayPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { ImageComponent } from "../Image/image";
import { LabelComponent } from "../Label/label";
import { Color } from "../../../types/color";
import { executeActions, WidgetActions } from "../widgetActions";
import { MacroContext } from "../../../types/macros";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { DType } from "../../../types/dtypes";

const SymbolProps = {
  imageFile: StringPropOpt,
  symbols: StringArrayPropOpt,
  alt: StringPropOpt,
  backgroundColor: ColorPropOpt,
  showBooleanLabel: BoolPropOpt,
  labelPosition: ChoicePropOpt([
    "top",
    "left",
    "center",
    "right",
    "bottom",
    "top left",
    "top right",
    "bottom left",
    "bottom right"
  ]),
  border: BorderPropOpt,
  rotation: FloatPropOpt,
  flipHorizontal: BoolPropOpt,
  flipVertical: BoolPropOpt,
  visible: BoolPropOpt,
  stretchToFit: BoolPropOpt,
  actions: ActionsPropType,
  font: FontPropOpt,
  initialIndex: FloatPropOpt,
  showIndex: BoolPropOpt,
  arrayIndex: FloatPropOpt,
  enabled: BoolPropOpt,
  fallbackSymbol: StringPropOpt,
  transparent: BoolPropOpt
};

export type SymbolComponentProps = InferWidgetProps<typeof SymbolProps> &
  PVComponent;

/**
 * This component combines the use of a svg with a label, and is used to replace
 * the MultistateMonitorWidget from CS-Studio
 * @param props
 */
export const SymbolComponent = (props: SymbolComponentProps): JSX.Element => {
  const {
    showIndex = false,
    arrayIndex = 0,
    initialIndex = 0,
    fallbackSymbol = "https://cs-web-symbol.diamond.ac.uk/catalogue/default.svg",
    transparent = true,
    backgroundColor = "white",
    showBooleanLabel = false,
    enabled = true
  } = props;
  const style = commonCss(props as any);
  // If symbols and not imagefile, we're in a bob file
  const isBob = props.symbols ? true : false;
  const symbols = props.symbols ? props.symbols : [];

  // Convert our value to an index, or use the initialIndex
  const index = convertValueToIndex(props.value, initialIndex, arrayIndex);

  const regex = / [0-9]\./;
  let imageFile = isBob ? symbols[index] : props.imageFile;
  // If no provided image file
  if (!imageFile) imageFile = fallbackSymbol;
  const intValue = DType.coerceDouble(props.value);
  if (!isNaN(intValue) && !isBob) {
    imageFile = imageFile.replace(regex, ` ${intValue.toFixed(0)}.`);
  }

  // Symbol in Phoebus has no label but can display index
  const labelText = isBob
    ? showIndex
      ? index.toString()
      : ""
    : props.value?.getStringValue();

  let alignItems = "center";
  let justifyContent = "center";
  switch (props.labelPosition) {
    case "top":
      alignItems = "flex-start";
      break;
    case "right":
      justifyContent = "flex-end";
      break;
    case "bottom":
      alignItems = "flex-end";
      break;
    case "left":
      justifyContent = "flex-start";
      break;
    case "top right":
      alignItems = "flex-start";
      justifyContent = "flex-end";
      break;
    case "bottom right":
      alignItems = "flex-end";
      justifyContent = "flex-end";
      break;
    case "bottom left":
      alignItems = "flex-end";
      justifyContent = "flex-start";
      break;
    case "top left":
      alignItems = "flex-start";
      justifyContent = "flex-start";
      break;
  }

  const files = useContext(FileContext);
  const exitContext = useContext(ExitFileContext);
  const parentMacros = useContext(MacroContext).macros;
  function onClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (props.actions !== undefined && enabled) {
      executeActions(
        props.actions as WidgetActions,
        files,
        exitContext,
        parentMacros
      );
    }
  }

  // Define label appearance
  let labelDiv;
  if (isBob) labelDiv = generateIndexLabel(index, showIndex);

  // Note: I would've preferred to define the onClick on div that wraps
  // both sub-components, but replacing the fragment with a div, with the way
  // the image component is written causes many images to be of the incorrect size
  return (
    <>
      <ImageComponent
        {...props}
        imageFile={imageFile}
        onClick={onClick}
        stretchToFit={true}
      />
      {isBob ? (
        labelDiv
      ) : showBooleanLabel ? (
        <>
          <div
            onClick={onClick}
            style={{
              ...style,
              backgroundColor: transparent
                ? "transparent"
                : backgroundColor.toString(),
              position: "absolute",
              height: "100%",
              width: "100%",
              top: 0,
              left: 0,
              display: "flex",
              alignItems,
              justifyContent
            }}
          >
            <div style={{ padding: "5%" }}>
              <LabelComponent
                {...props}
                backgroundColor={Color.TRANSPARENT}
                text={labelText}
              ></LabelComponent>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
};

/**
 * Return a div element describing how the label should look
 */
function generateIndexLabel(index: number, showIndex: boolean): JSX.Element {
  if (!showIndex) return <></>;
  // Create span
  return (
    <div style={{ justifyContent: "center", alignContent: "center" }}>
      <span
        style={{
          height: "30px",
          width: "30px",
          borderRadius: "50%",
          backgroundColor: "black",
          border: "1px solid white",
          opacity: "50%",
          color: "white",
          position: "absolute",
          top: "calc(50% - 15px)",
          left: "calc(50% - 15px)",
          textAlign: "center",
          fontSize: "math"
        }}
      >
        <b>{index}</b>
      </span>
    </div>
  );
}

/**
 * Convert the input value into an index for symbols
 * @param value
 */
function convertValueToIndex(
  value: DType | undefined,
  initialIndex: number,
  arrayIndex: number
): number {
  // If no value, use initialIndex
  if (value === undefined) return initialIndex;
  // First we check if we have a string
  const isArray = value.getArrayValue()?.length !== undefined ? true : false
  if (isArray) {
    // If is array, get index
    const arrayValue = DType.coerceArray(value);
    const idx = Number(arrayValue[arrayIndex]);
    return Math.floor(idx);
  } else {
    console.log(value);
    const intValue = DType.coerceDouble(value);
    console.log(intValue);
    if (!isNaN(intValue)) return Math.floor(intValue);
  }
  return initialIndex;
}

const SymbolWidgetProps = {
  ...SymbolProps,
  ...PVWidgetPropType
};

export const Symbol = (
  props: InferWidgetProps<typeof SymbolWidgetProps>
): JSX.Element => <Widget baseWidget={SymbolComponent} {...props} />;

registerWidget(Symbol, SymbolWidgetProps, "symbol");
