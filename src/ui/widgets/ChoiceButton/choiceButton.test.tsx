import React from "react";
import { ChoiceButtonComponent } from "./choiceButton";
import { render } from "@testing-library/react";
import { DDisplay, DType } from "../../../types/dtypes";
import { Color } from "../../../types";

const ChoiceButtonRenderer = (choiceButtonProps: any): JSX.Element => {
  return <ChoiceButtonComponent {...choiceButtonProps} />;
};

describe("<BoolButton />", (): void => {
  test("it renders ChoiceButton with default props", (): void => {
    const choiceButtonProps = {
      value: null
    };
    const { getAllByRole } = render(ChoiceButtonRenderer(choiceButtonProps));
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons[0].textContent).toEqual("Item 1");
    expect(buttons[1].textContent).toEqual("Item 2");
    expect(buttons[0].style.height).toEqual("43px");
    expect(buttons[1].style.width).toEqual("46px");
    expect(buttons[0].style.backgroundColor).toEqual("rgb(210, 210, 210)");
    expect(buttons[1].style.fontSize).toEqual("0.875rem");
  });

  test("pass props to widget", (): void => {
    const choiceButtonProps = {
      value: new DType({ doubleValue: 0 }),
      width: 60,
      height: 140,
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
    // First button is selected therefore different color and box shadow
    expect(buttons[0].style.boxShadow).toEqual(
      "inset 0px 23px 35px 0px rgba(0,0,0,0.3)"
    );
    expect(buttons[0].style.backgroundColor).toEqual("rgb(10, 60, 40)");
    expect(buttons[2].textContent).toEqual("Setting");
    expect(buttons[3].style.cursor).toEqual("not-allowed");
    expect(buttons[3].style.height).toEqual("31px");
    expect(buttons[3].style.backgroundColor).toEqual("rgb(20, 20, 200)");
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
});
