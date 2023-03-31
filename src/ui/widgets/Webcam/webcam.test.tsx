import React from "react";
import { contextRender } from "../../../testResources";
import { fireEvent } from "@testing-library/react";
import { WebcamComponent } from "./webcam";

describe("<Webcam />", (): void => {
  test("it displays the alt text while loading", (): void => {
    const { getByAltText } = contextRender(
      <WebcamComponent
        url="http://fake-stream.diamond.ac.uk/video.mjpg"
        name="one"
      />
    );
    expect(getByAltText("Loading Webcam MJPEG stream...")).toBeInTheDocument();
  });

  test("it displays the alt text once loaded", (): void => {
    const { getByAltText } = contextRender(
      <WebcamComponent
        url="http://fake-stream.diamond.ac.uk/video.mjpg"
        name="two"
      />
    );
    fireEvent.load(
      getByAltText("Loading Webcam MJPEG stream...") as HTMLImageElement
    );
    expect(
      getByAltText(
        "Webcam MJPEG stream at http://fake-stream.diamond.ac.uk/video.mjpg"
      )
    ).toBeInTheDocument();
  });

  test("it displays the alt text when error occurs", (): void => {
    const { getByAltText } = contextRender(
      <WebcamComponent
        url="http://fake-stream.diamond.ac.uk/video.mjpg"
        name="three"
      />
    );
    fireEvent.error(
      getByAltText("Loading Webcam MJPEG stream...") as HTMLImageElement
    );
    expect(
      getByAltText(
        "Connection to webcam at http://fake-stream.diamond.ac.uk/video.mjpg failed"
      )
    ).toBeInTheDocument();
  });
});
