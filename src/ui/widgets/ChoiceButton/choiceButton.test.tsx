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
    const { getAllByRole, asFragment } = render(
      ChoiceButtonRenderer(choiceButtonProps)
    );
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons[0].textContent).toEqual("Item 1");
    expect(buttons[1].textContent).toEqual("Item 2");
    expect(asFragment()).toMatchSnapshot();
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
    const { getAllByRole, asFragment } = render(
      ChoiceButtonRenderer(choiceButtonProps)
    );
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons.length).toEqual(4);
    expect(buttons[2].textContent).toEqual("Setting");
    expect(buttons[3]).toHaveProperty("disabled", true);
    expect(asFragment()).toMatchSnapshot();
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
