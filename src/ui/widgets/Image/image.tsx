import React, { CSSProperties } from "react";

import { commonCss, Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import {
  InferWidgetProps,
  StringProp,
  BoolPropOpt,
  StringPropOpt,
  FloatPropOpt,
  FuncPropOpt,
  MacrosPropOpt
} from "../propTypes";
import { registerWidget } from "../register";

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
  overflow: BoolPropOpt
};

export const ImageComponent = (
  props: InferWidgetProps<typeof ImageProps>
): JSX.Element => {
  const { rotation = 0, flipHorizontal, flipVertical } = props;

  const onClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (props.onClick) {
      props.onClick(event);
    }
  };

  const overflow = props.overflow ? "visible" : "hidden";

  const style: CSSProperties = {
    ...commonCss(props as any),
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

  return (
    <div style={style} onClick={onClick}>
      <img
        src={imageFileName}
        alt={props.alt || undefined}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          transform: `rotate(${rotation}deg) scaleX(${
            flipHorizontal ? -1 : 1
          }) scaleY(${flipVertical ? -1 : 1})`,
          objectFit: props.stretchToFit ? "fill" : "none",
          objectPosition: "top left"
        }}
      />
    </div>
  );
};

const ImageWidgetProps = {
  ...ImageProps,
  ...WidgetPropType
};

export const Image = (
  props: InferWidgetProps<typeof ImageWidgetProps>
): JSX.Element => <Widget baseWidget={ImageComponent} {...props} />;

registerWidget(Image, ImageWidgetProps, "image");
