import React from "react";
import { ChoiceButtonComponent } from "./choiceButton";
import { fireEvent, render } from "@testing-library/react";
import { DDisplay, DType } from "../../../types/dtypes";
import { Color, Font } from "../../../types";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";

const ChoiceButtonRenderer = (choiceButtonProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <ChoiceButtonComponent {...choiceButtonProps} />
    </ThemeProvider>
  );
};

describe("<ChoiceButton />", (): void => {
  test("it renders ChoiceButton with default props", (): void => {
    const choiceButtonProps = {
      value: null
    };
    const { getAllByRole } = render(ChoiceButtonRenderer(choiceButtonProps));
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons[0].textContent).toEqual("Item 1");
    expect(buttons[1].textContent).toEqual("Item 2");

    buttons.forEach(button => {
      expect(button).toHaveStyle({
        "background-color": "rgb(210, 210, 210)",
        height: "43px",
        width: "50px",
        "font-size": "14px"
      });
    });
  });

  test("pass props to widget", (): void => {
    const choiceButtonProps = {
      value: new DType({ doubleValue: 0 }),
      width: 60,
      height: 140,
      font: new Font(12),
      items: ["Choice", "Option", "Setting", "Custom"],
      horizontal: false,
      backgroundColor: Color.fromRgba(20, 20, 200),
      selectedColor: Color.fromRgba(10, 60, 40),
      itemsFromPv: false,
      enabled: false
    };
    const { getAllByRole } = render(ChoiceButtonRenderer(choiceButtonProps));
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons.length).toEqual(4);
    expect(buttons[2].textContent).toEqual("Setting");
    expect(buttons[3]).toHaveProperty("disabled", true);

    expect(buttons[0]).toHaveStyle({
      "background-color": "rgb(20, 20, 200)",
      "font-size": "0.75rem"
    });

    expect(buttons[3]).toHaveStyle({
      cursor: "not-allowed",
      height: "35px"
    });
  });

  test("pass props to widget, using itemsFromPv", (): void => {
    const choiceButtonProps = {
      value: new DType(
        { doubleValue: 0 },
        undefined,
        undefined,
        new DDisplay({ choices: ["hi", "Hello"] })
      ),
      items: ["one", "two", "three"],
      horizontal: false,
      itemsFromPv: true,
      enabled: true
    };
    const { getAllByRole } = render(ChoiceButtonRenderer(choiceButtonProps));
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons.length).toEqual(2);
    // First button is selected therefore different color and box shadow
    expect(buttons[0].textContent).toEqual("hi");
    expect(buttons[1].textContent).toEqual("Hello");
  });

  test("selecting a button", (): void => {
    const choiceButtonProps = {
      value: null
    };
    const { getAllByRole } = render(ChoiceButtonRenderer(choiceButtonProps));
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons[0].textContent).toEqual("Item 1");
    expect(buttons[1].textContent).toEqual("Item 2");

    expect(buttons[0]).toHaveStyle({
      "background-color": "rgb(210, 210, 210)"
    });
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveStyle({
      "background-color": "rgb(210, 210, 210)"
    });
  });
});
