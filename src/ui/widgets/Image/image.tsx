import React, { CSSProperties } from "react";

import { Widget } from "../widget";
import { useStyle } from "../../hooks/useStyle";
import { WidgetPropType } from "../widgetProps";
import {
  InferWidgetProps,
  StringProp,
  BoolPropOpt,
  StringPropOpt,
  FloatPropOpt,
  FuncPropOpt,
  MacrosPropOpt,
  ColorPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { Box } from "@mui/material";

const widgetName = "image";

const ImageProps = {
  imageFile: StringProp,
  macros: MacrosPropOpt,
  alt: StringPropOpt,
  stretchToFit: BoolPropOpt,
  fitToWidth: BoolPropOpt,
  fitToHeight: BoolPropOpt,
  rotation: FloatPropOpt,
  flipHorizontal: BoolPropOpt,
  flipVertical: BoolPropOpt,
  onClick: FuncPropOpt,
  overflow: BoolPropOpt,
  backgroundColor: ColorPropOpt,
  transparent: BoolPropOpt,
  preserveRatio: BoolPropOpt,
  opacity: FloatPropOpt
};

export const ImageComponent = (
  props: InferWidgetProps<typeof ImageProps>
): JSX.Element => {
  const {
    rotation = 0,
    flipHorizontal,
    flipVertical,
    stretchToFit = false,
    preserveRatio = false,
    opacity = 1
  } = props;

  const onClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (props.onClick) {
      props.onClick(event);
    }
  };

  const overflow = props.overflow ? "visible" : "hidden";

  const style = useStyle(props, widgetName);
  const fullStyle: CSSProperties = {
    ...style.colors,
    ...style.font,
    ...style.border,
    ...style.other,
    overflow,
    textAlign: "left",
    width: "100%",
    height: "100%"
  };

  // Should we be refreshing image instead of using cache
  let imageFileName = props.imageFile;
  // If a filename has been appended with '#' or '#{number}' this indicates
  // that it should be refreshed. The only way to refresh the image from it's
  // source instead of the browser cache is to further append the timestamp
  // to the filename. As it follows the '#', it will not affect the file
  // look-up location.
  if (imageFileName.includes("#")) {
    imageFileName = imageFileName + new Date().getTime();
  }

  // In Phoebus, the aspect ratio of svgs is always maintained even when
  // stretchToFit is true. Also accept preserveRatio property passed from
  // Symbol widget
  const ratio = imageFileName.includes(".svg") ? true : preserveRatio;
  return (
    <Box sx={fullStyle} onClick={onClick}>
      <img
        src={imageFileName}
        alt={props.alt || undefined}
        style={{
          display: "block",
          transform: `rotate(${rotation}deg) scaleX(${
            flipHorizontal ? -1 : 1
          }) scaleY(${flipVertical ? -1 : 1})`,
          objectFit: ratio || !stretchToFit ? "contain" : "fill",
          objectPosition: "top left",
          opacity: opacity
        }}
      />
    </Box>
  );
};

const ImageWidgetProps = {
  ...ImageProps,
  ...WidgetPropType
};

export const Image = (
  props: InferWidgetProps<typeof ImageWidgetProps>
): JSX.Element => <Widget baseWidget={ImageComponent} {...props} />;

registerWidget(Image, ImageWidgetProps, widgetName);
