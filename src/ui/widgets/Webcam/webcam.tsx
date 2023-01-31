import React, { useState, useEffect } from "react";
import classes from "./webcam.module.css";

/**
 * Creates a Webcam component for displaying MJPEG
 * streams
 * @param props url of webcam stream
 * @returns HTML component
 */
export const Webcam = (props: { url: string }): JSX.Element => {
  const { width, height } = useWindowDimensions();
  // Create image tag
  const webcamImg = (
    <div
      style={{
        height: height,
        width: width,
        fontSize: "14px", // Set properties for image alt text
        fontWeight: "bold",
        color: "#a6190f"
      }}
    >
      <img
        id="stream"
        className={classes.img}
        src={props.url}
        alt={`Loading Webcam MJPEG stream...`}
        onError={onError}
        onLoad={onLoad}
      />
    </div>
  );
  return webcamImg;
};

/**
 * Returns an error visible to the user when the MJPEG stream
 * at the given URL cannot be reached.
 */
function onError() {
  const image = document.getElementById("stream") as HTMLImageElement;
  const alt = `Connection to webcam at ${image.src} failed`;
  (document.getElementById("stream") as HTMLImageElement).alt = alt;
}

/**
 * Changes image alt text once image is loaded.
 */
function onLoad() {
  const image = document.getElementById("stream") as HTMLImageElement;
  const alt = `Webcam MJPEG stream at ${image.src}`;
  (document.getElementById("stream") as HTMLImageElement).alt = alt;
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}
