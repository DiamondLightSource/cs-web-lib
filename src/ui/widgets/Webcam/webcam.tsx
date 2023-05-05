import React from "react";
import classes from "./webcam.module.css";
import { StringPropOpt, InferWidgetProps } from "../propTypes";
import { WidgetPropType } from "../widgetProps";
import { Widget } from "../widget";
import { registerWidget } from "../register";

const WebcamProps = {
  name: StringPropOpt,
  url: StringPropOpt
};

/**
 * Creates a Webcam component for displaying MJPEG
 * streams
 * @param props url of webcam stream
 * @returns HTML component
 */
export const WebcamComponent = (
  props: InferWidgetProps<typeof WebcamProps>
): JSX.Element => {
  // Create image tag
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: "14px", // Set properties for image alt text
        fontWeight: "bold",
        color: "#a6190f"
      }}
    >
      <img
        id={props.name}
        className={classes.img}
        src={props.url}
        alt={`Loading Webcam MJPEG stream...`}
        onError={onError}
        onLoad={onLoad}
      />
    </div>
  );
};

/**
 * Returns an error visible to the user when the MJPEG stream
 * at the given URL cannot be reached.
 */
function onError(event: any) {
  const image = document.getElementById(event.target.id) as HTMLImageElement;
  const alt = `Connection to webcam at ${image.src} failed`;
  image.alt = alt;
}

/**
 * Changes image alt text once image is loaded.
 */
function onLoad(event: any) {
  const image = document.getElementById(event.target.id) as HTMLImageElement;
  const alt = `Webcam MJPEG stream at ${image.src}`;
  image.alt = alt;
}

const WebcamWidgetProps = {
  ...WebcamProps,
  ...WidgetPropType
};

export const Webcam = (
  props: InferWidgetProps<typeof WebcamWidgetProps>
): JSX.Element => <Widget baseWidget={WebcamComponent} {...props} />;

registerWidget(Webcam, WebcamWidgetProps, "webcam");
