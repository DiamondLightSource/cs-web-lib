import React from "react";
import { ChoiceButtonComponent } from "./choiceButton";
import { fireEvent, render } from "@testing-library/react";
import { newDDisplay, newDType } from "../../../types/dtypes";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { PvDatum } from "../../../redux/csState";
import { ColorUtils } from "../../../types/color";
import { newFont } from "../../../types/font";

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
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: undefined
        } as Partial<PvDatum> as PvDatum
      ]
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
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 0 })
        } as Partial<PvDatum> as PvDatum
      ],
      width: 60,
      height: 140,
      font: newFont(12),
      items: ["Choice", "Option", "Setting", "Custom"],
      horizontal: false,
      backgroundColor: ColorUtils.fromRgba(20, 20, 200),
      selectedColor: ColorUtils.fromRgba(10, 60, 40),
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
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType(
            { doubleValue: 0 },
            undefined,
            undefined,
            newDDisplay({ choices: ["hi", "Hello"] })
          )
        } as Partial<PvDatum> as PvDatum
      ],
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
      pvData: []
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
