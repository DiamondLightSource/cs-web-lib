import React from "react";
import { LabelComponent } from "./label";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";

const BASE_PROPS = {
  text: "hello"
};

const LabelRenderer = (labelProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <LabelComponent {...labelProps} />
    </ThemeProvider>
  );
};

describe("<Label />", (): void => {
  test("it renders a basic element with default props", (): void => {
    const { getByText } = render(LabelRenderer(BASE_PROPS));
    const label = getByText("hello");

    expect(label).toHaveStyle({
      "background-color": "rgba(0, 0, 0, 0)",
      color: "rgb(0,0,0)",
      "align-items": "flex-start"
    });
  });

  test("it renders the element with custom props", (): void => {
    const props = {
      ...BASE_PROPS,
      textAlign: "right",
      textAlignV: "bottom",
      transparent: false,
      backgroundColor: "rgb(10, 60, 40)",
      foregroundColor: "rgb(240, 240, 50)"
    };
    const { getByText } = render(LabelRenderer(props));
    const label = getByText("hello");

    expect(label).toHaveStyle({
      "background-color": "rgb(10, 60, 40)",
      color: "rgb(240, 240, 50)",
      "align-items": "flex-end",
      "justify-content": "flex-end"
    });
  });

  test("the label rotates correctly", (): void => {
    const props = {
      ...BASE_PROPS,
      rotationStep: 3,
      height: 60,
      width: 75
    };
    const { getByText } = render(LabelRenderer(props));
    const label = getByText("hello");

    expect(label).toHaveStyle({
      width: "60px",
      height: "75px",
      transform: "rotate(-270deg) translateY(-7.5px) translateX(-7.5px)"
    });
  });

  test("the label doesn't rotate for relative sizes", (): void => {
    const props = {
      ...BASE_PROPS,
      rotationStep: 3,
      height: "5vh",
      width: "5vh"
    };
    const { getByText } = render(LabelRenderer(props));
    const label = getByText("hello");

    expect(label).toHaveStyle({
      width: "100%",
      height: "100%",
      transform: ""
    });
  });
});
