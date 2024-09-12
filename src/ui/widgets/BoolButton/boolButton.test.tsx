import React from "react";
import { BoolButtonComponent } from "./boolButton";
import { fireEvent, render } from "@testing-library/react";
import { DType } from "../../../types/dtypes";
import { Color } from "../../../types";

const BoolButtonRenderer = (boolButtonProps: any): JSX.Element => {
  return <BoolButtonComponent {...boolButtonProps} />;
};

const TEST_PROPS = {
  value: new DType({ doubleValue: 1 }),
  width: 45,
  height: 20,
  onColor: Color.fromRgba(0, 235, 10),
  offColor: Color.fromRgba(0, 100, 0),
  onLabel: "Enabled",
  offLabel: "Disabled",
  squareButton: true,
  backgroundColor: Color.fromRgba(20, 20, 200),
  foregroundColor: Color.fromRgba(10, 60, 40),
  showBooleanLabel: true,
  onState: 1,
  offState: 0
};

describe("<BoolButton />", (): void => {
  test("it renders a button with default values", (): void => {
    const boolButtonProps = {
      value: new DType({ doubleValue: 1 }),
      onState: 1,
      offState: 0
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;

    expect(button.textContent).toEqual("On");
    expect(button.style.height).toEqual("30px");
    expect(button.style.width).toEqual("100px");
    expect(button.style.backgroundColor).toEqual("rgb(200, 200, 200)");
    expect(button.style.borderRadius).toEqual("");
  });

  test("it renders a button with led and overwrites default values", (): void => {
    const boolButtonProps = {
      ...TEST_PROPS,
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    const spanElement = button.firstChild as HTMLSpanElement;
    const led = spanElement.children[0] as HTMLSpanElement;
    const text = spanElement.children[1] as HTMLSpanElement;

    expect(button.textContent).toEqual("Enabled");
    expect(button.style.height).toEqual("20px");
    expect(button.style.width).toEqual("45px");
    expect(button.style.backgroundColor).toEqual("rgb(20, 20, 200)");
    // Vite adds random hashhex to all CSS module classnames, so check if contains not equals
    expect(led.className).toContain("Led");
    expect(led.style.backgroundColor).toEqual("rgb(0, 235, 10)");
    expect(led.style.height).toEqual("11px");
    expect(led.style.boxShadow).toEqual(
      "inset 2.75px 2.75px 4.4px rgba(255,255,255,.5)"
    );
    expect(button.style.borderRadius).toEqual("");
    // Vite adds random hashhex to all CSS module classnames, so check if contains not equals
    expect(text.className).toContain("Text");
  });

  test("no text if showboolean is false", (): void => {
    const boolButtonProps = {
      value: new DType({ doubleValue: 0 }),
      showBooleanLabel: false,
      onState: 1,
      offState: 0
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    const spanElement = button.firstChild as HTMLSpanElement;
    const text = spanElement.children[1] as HTMLSpanElement;

    expect(text.textContent).toEqual("");
    expect(button.style.backgroundColor).toEqual("rgb(200, 200, 200)");
  });

  test("on click change led colour if no text ", async (): Promise<void> => {
    const boolButtonProps = {
      ...TEST_PROPS,
      value: new DType({ doubleValue: 0 }),
      onLabel: "",
      offLabel: "",
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    const spanElement = button.firstChild as HTMLSpanElement;
    const led = spanElement.children[0] as HTMLSpanElement;
    // Original off values
    expect(led.style.backgroundColor).toEqual("rgb(0, 100, 0)");

    // Click button to on
    fireEvent.click(button);

    expect(led.style.backgroundColor).toEqual("rgb(0, 235, 10)");
  });

  test("on click change text and led colour ", async (): Promise<void> => {
    const boolButtonProps = {
      ...TEST_PROPS,
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    const spanElement = button.firstChild as HTMLSpanElement;
    const led = spanElement.children[0] as HTMLSpanElement;
    const text = spanElement.children[1] as HTMLSpanElement;
    // Original on values
    expect(text.textContent).toEqual("Enabled");
    expect(led.style.backgroundColor).toEqual("rgb(0, 235, 10)");

    // Click button to off
    fireEvent.click(button);

    expect(text.textContent).toEqual("Disabled");
    expect(led.style.backgroundColor).toEqual("rgb(0, 100, 0)");
  });

  test("change background colour if no LED", async (): Promise<void> => {
    const boolButtonProps = {
      ...TEST_PROPS,
      showLed: false
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;

    // Original on values
    expect(button.style.backgroundColor).toEqual("rgb(0, 235, 10)");

    // Click button to off
    fireEvent.click(button);

    expect(button.style.backgroundColor).toEqual("rgb(0, 100, 0)");
  });
});
