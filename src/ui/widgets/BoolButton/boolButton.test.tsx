import React from "react";
import { BoolButtonComponent } from "./boolButton";
import { fireEvent, render } from "@testing-library/react";
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
    expect(button.style.height).toEqual("50px");
    expect(button.style.width).toEqual("100px");
    expect(button.style.backgroundColor).toEqual("rgb(0, 255, 0)");
    expect(button.style.borderRadius).toEqual("50%");
  });

  test("it renders a button and overwrites default values", (): void => {
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
      showBoolean: true,
      onState: 1,
      offState: 0
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    expect(button.textContent).toEqual("Enabled");
    expect(button.style.height).toEqual("20px");
    expect(button.style.width).toEqual("45px");
    expect(button.style.backgroundColor).toEqual("rgb(0, 235, 10)");
    expect(button.style.borderRadius).toEqual("");
  });

  test("no text if showboolean is false", (): void => {
    const boolButtonProps = {
      value: new DType({ doubleValue: 0 }),
      showBoolean: false,
      onState: 1,
      offState: 0
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    expect(button.textContent).toEqual("");
    expect(button.style.backgroundColor).toEqual("rgb(200, 200, 200)");
  });

  test("on click change text and colour ", async (): Promise<void> => {
    const boolButtonProps = {
      value: new DType({ doubleValue: 0 }),
      width: 45,
      height: 20,
      onColor: Color.fromRgba(0, 235, 10),
      offColor: Color.fromRgba(0, 100, 0),
      onLabel: "Enabled",
      offLabel: "Disabled",
      squareButton: true,
      backgroundColor: Color.fromRgba(20, 20, 200),
      foregroundColor: Color.fromRgba(10, 60, 40),
      showBoolean: true,
      onState: 1,
      offState: 0
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;

    // Original off values
    expect(button.textContent).toEqual("Disabled");
    expect(button.style.backgroundColor).toEqual("rgb(0, 100, 0)");

    // Click button to on
    fireEvent.click(button);

    expect(button.textContent).toEqual("Enabled");
    expect(button.style.backgroundColor).toEqual("rgb(0, 235, 10)");

    // Click button again to return to original
    fireEvent.click(button);
    expect(button.textContent).toEqual("Disabled");
    expect(button.style.backgroundColor).toEqual("rgb(0, 100, 0)");
  });
});
