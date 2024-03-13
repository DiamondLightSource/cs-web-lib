import React from "react";
import { BoolButtonComponent } from "./boolButton";
import { fireEvent, render, within } from "@testing-library/react";
import { DType } from "../../../types/dtypes";
import { Color } from "../../../types";

const BoolButtonRenderer = (boolButtonProps: any): JSX.Element => {
  return <BoolButtonComponent {...boolButtonProps} />;
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

    expect(button.textContent).toEqual("ON");
    expect(button.style.height).toEqual("30px");
    expect(button.style.width).toEqual("100px");
    expect(button.style.backgroundColor).toEqual("rgb(200, 200, 200)");
    expect(button.style.borderRadius).toEqual("");
  });

  test("it renders a button with led and overwrites default values", (): void => {
    const boolButtonProps = {
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
      offState: 0,
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    // span isn't a proper role so find by lack of text
    const span = within(button).getByText("") as HTMLSpanElement;
    expect(button.textContent).toEqual("Enabled");
    expect(button.style.height).toEqual("20px");
    expect(button.style.width).toEqual("45px");
    expect(button.style.backgroundColor).toEqual("rgb(20, 20, 200)");
    expect(span.style.backgroundColor).toEqual("rgb(0, 235, 10)");
    expect(span.style.height).toEqual("8.125px");
    expect(span.style.left).toEqual("31.9375px");
    expect(span.style.boxShadow).toEqual(
      "inset 2.03125px 2.03125px 3.25px rgba(255,255,255,.5)"
    );
    expect(button.style.borderRadius).toEqual("");
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
    expect(button.textContent).toEqual("");
    expect(button.style.backgroundColor).toEqual("rgb(200, 200, 200)");
  });

  test("on click change led colour if no text ", async (): Promise<void> => {
    const boolButtonProps = {
      value: new DType({ doubleValue: 0 }),
      width: 45,
      height: 20,
      onColor: Color.fromRgba(0, 235, 10),
      offColor: Color.fromRgba(0, 100, 0),
      onLabel: "",
      offLabel: "",
      squareButton: true,
      backgroundColor: Color.fromRgba(20, 20, 200),
      foregroundColor: Color.fromRgba(10, 60, 40),
      showBooleanLabel: false,
      onState: 1,
      offState: 0,
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    // span isn't a proper role so find by lack of text
    const span = within(button).getAllByText("")[1] as HTMLSpanElement;
    // Original off values
    expect(span.style.backgroundColor).toEqual("rgb(0, 100, 0)");

    // Click button to on
    fireEvent.click(button);

    expect(span.style.backgroundColor).toEqual("rgb(0, 235, 10)");
  });

  test("on click change text and led colour ", async (): Promise<void> => {
    const boolButtonProps = {
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
      offState: 0,
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    // span isn't a proper role so find by lack of text
    const span = within(button).getByText("") as HTMLSpanElement;
    // Original on values
    expect(button.textContent).toEqual("Enabled");
    expect(span.style.backgroundColor).toEqual("rgb(0, 235, 10)");

    // Click button to off
    fireEvent.click(button);

    expect(button.textContent).toEqual("Disabled");
    expect(span.style.backgroundColor).toEqual("rgb(0, 100, 0)");
  });
});
