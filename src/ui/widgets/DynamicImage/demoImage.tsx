import React from "react";
import { Widget } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { InferWidgetProps, MacrosPropOpt, ColorPropOpt } from "../propTypes";
import { registerWidget } from "../register";
import { Box } from "@mui/material";

const DemoImageProps = {
  macros: MacrosPropOpt,
  backgroundColor: ColorPropOpt
};

export const DemoImageComponent = (
  props: InferWidgetProps<typeof DemoImageProps>
): JSX.Element => {
  // this image needs to be exist in the Daedalus public/images folder
  const imageFileName = "/images/demoCameraImage.jpg";

  return (
    <Box
      component="img"
      src={imageFileName}
      alt={"Static demo image"}
      sx={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
        backgroundColor: props?.backgroundColor?.toString()
      }}
    />
  );
};

const DemoImageWidgetProps = {
  ...DemoImageProps,
  ...WidgetPropType
};

export const DemoImage = (
  props: InferWidgetProps<typeof DemoImageWidgetProps>
): JSX.Element => <Widget baseWidget={DemoImageComponent} {...props} />;

registerWidget(DemoImage, DemoImageWidgetProps, "demoImage");
