import React, { CSSProperties } from "react";
import { setFillOptions } from "./ellipse";
import { Color } from "../../../types/color";

const DEFAULT_FILL_OPTIONS = {
  transparent: false,
  horizontalFill: false,
  gradient: false,
  bgGradientColor: Color.fromRgba(0, 0, 0),
  fgGradientColor: Color.fromRgba(0, 0, 255),
  bgColor: Color.fromRgba(0, 255, 255),
  level: 0
};

describe("<EllipseComponent />", (): void => {
  test("set solid color fill", (): void => {
    let style: CSSProperties = {};
    style = setFillOptions(style, DEFAULT_FILL_OPTIONS);
    expect(style.background).toEqual("rgba(0,255,255,255)");
  });
  test("set gradient fill", (): void => {
    let style: CSSProperties = {};
    const fillOptions = { ...DEFAULT_FILL_OPTIONS, gradient: true };
    style = setFillOptions(style, fillOptions);
    expect(style.background).toEqual(
      "-webkit-linear-gradient(bottom, rgba(0,0,0,255) 0%, rgba(0,0,255,255))"
    );
  });
  test("set gradient color fill horizontal", (): void => {
    let style: CSSProperties = {};
    const fillOptions = {
      ...DEFAULT_FILL_OPTIONS,
      gradient: true,
      horizontalFill: true,
      level: "50%"
    };
    style = setFillOptions(style, fillOptions);
    expect(style.background).toEqual(
      "-webkit-linear-gradient(left, rgba(0,0,0,255) 50%%, rgba(0,0,255,255))"
    );
  });
  test("set transparent", (): void => {
    let style: CSSProperties = {};
    const fillOptions = { ...DEFAULT_FILL_OPTIONS, transparent: true };
    style = setFillOptions(style, fillOptions);
    expect(style.background).toEqual("transparent");
  });
});
