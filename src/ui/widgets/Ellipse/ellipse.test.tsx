import { CSSProperties } from "react";
import { FillOptions, setFillOptions } from "./ellipse";
import { ColorUtils } from "../../../types/color";

const DEFAULT_FILL_OPTIONS = {
  transparent: false,
  horizontalFill: false,
  gradient: false,
  bgGradientColor: ColorUtils.fromRgba(0, 0, 0),
  fgGradientColor: ColorUtils.fromRgba(0, 0, 255),
  bgColor: ColorUtils.fromRgba(30, 144, 255),
  level: 0
};

describe("<EllipseComponent />", (): void => {
  test("set solid color fill", (): void => {
    let style: CSSProperties = {};
    style = setFillOptions(style, DEFAULT_FILL_OPTIONS);
    expect(style.background).toEqual("rgba(30,144,255,1)");
  });
  test("set gradient fill", (): void => {
    let style: CSSProperties = {};
    const fillOptions = { ...DEFAULT_FILL_OPTIONS, gradient: true };
    style = setFillOptions(style, fillOptions);
    expect(style.background).toEqual(
      "-webkit-linear-gradient(left, rgba(0,0,0,1) 0%, rgba(30,144,255,1))"
    );
  });
  test("set gradient color fill horizontal", (): void => {
    let style: CSSProperties = {};
    const fillOptions: FillOptions = {
      ...DEFAULT_FILL_OPTIONS,
      gradient: true,
      horizontalFill: true,
      level: "50%"
    };
    style = setFillOptions(style, fillOptions);
    expect(style.background).toEqual(
      "-webkit-linear-gradient(bottom, rgba(30,144,255,1) 50%%, rgba(0,0,0,1))"
    );
  });
  test("set transparent", (): void => {
    let style: CSSProperties = {};
    const fillOptions = { ...DEFAULT_FILL_OPTIONS, transparent: true };
    style = setFillOptions(style, fillOptions);
    expect(style.background).toEqual("transparent");
  });
});
