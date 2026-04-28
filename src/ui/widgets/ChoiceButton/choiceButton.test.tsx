import React from "react";
import { ChoiceButtonComponent } from "./choiceButton";
import { fireEvent, render } from "@testing-library/react";
import { newDDisplay, newDType } from "../../../types/dtypes";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { PvDatum } from "../../../redux/csState";
import { ColorUtils } from "../../../types/color";
import { newFont } from "../../../types/font";
import { vi } from "vitest";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() => ({
    colors: {
      color: "rgb(155, 160, 209)",
      backgroundColor: "rgba(0, 0, 0, 1)"
    },
    font: {
      fontFamily: undefined,
      fontSize: "0.75rem",
      fontStyle: undefined,
      fontWeight: undefined
    }
  }))
}));

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() =>
    createMockStyle({
      font: {
        fontSize: "0.75rem"
      }
    })
  )
}));

let mockSize = { width: 15, height: 140 };

vi.mock("../../hooks/useMeasuredSize", () => ({
  useMeasuredSize: () => [{ current: null }, mockSize]
}));
const ChoiceButtonRenderer = (choiceButtonProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <ChoiceButtonComponent {...choiceButtonProps} />
    </ThemeProvider>
  );
};

describe("<ChoiceButton />", (): void => {
  test("it renders ChoiceButton with default props", (): void => {
    mockSize = { width: 100, height: 43 };
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
        "background-color": "rgb(0, 0, 0)",
        height: "43px",
        width: "50px",
        "font-size": "0.75rem"
      });
    });
  });

  test("pass props to widget", (): void => {
    mockSize = { width: 60, height: 140 };
    const choiceButtonProps = {
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 0 })
        } as Partial<PvDatum> as PvDatum
      ],
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
      "background-color": "rgb(0, 0, 0)",
      "font-size": "0.75rem"
    });

    expect(buttons[3]).toHaveStyle({
      cursor: "not-allowed",
      height: "35px",
      width: "60px"
    });
  });

  test("pass props to widget, for horizontal layout and pixel width", (): void => {
    mockSize = { width: 60, height: 140 };
    const choiceButtonProps = {
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 0 })
        } as Partial<PvDatum> as PvDatum
      ],
      font: newFont(12),
      items: ["Choice", "Option", "Setting", "Custom"],
      horizontal: true,
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
      "background-color": "rgb(0, 0, 0)",
      "font-size": "0.75rem",
      height: "140px",
      width: "15px"
    });
    expect(buttons[1]).toHaveStyle({
      height: "140px",
      width: "15px"
    });
    expect(buttons[2]).toHaveStyle({
      height: "140px",
      width: "15px"
    });
    expect(buttons[3]).toHaveStyle({
      cursor: "not-allowed",
      height: "140px",
      width: "15px"
    });
  });

  test("pass props to widget, for horizontal layout and percentage width", (): void => {
    mockSize = { width: 100, height: 140 };

    const choiceButtonProps = {
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 0 })
        } as Partial<PvDatum> as PvDatum
      ],
      font: newFont(12),
      items: ["Choice", "Option", "Setting", "Custom"],
      horizontal: true,
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
      "background-color": "rgb(0, 0, 0)",
      "font-size": "0.75rem",
      height: "140px",
      width: "25px"
    });
    expect(buttons[1]).toHaveStyle({
      height: "140px",
      width: "25px"
    });
    expect(buttons[2]).toHaveStyle({
      height: "140px",
      width: "25px"
    });
    expect(buttons[3]).toHaveStyle({
      cursor: "not-allowed",
      height: "140px",
      width: "25px"
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
      "background-color": "rgb(0, 0, 0)"
    });
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveStyle({
      "background-color": "rgb(0, 0, 0)"
    });
  });

  test("it is diabled when readOnly is true", (): void => {
    const choiceButtonProps = {
      pvData: [{ readonly: true }]
    };
    const { getAllByRole } = render(ChoiceButtonRenderer(choiceButtonProps));
    const buttons = getAllByRole("button") as Array<HTMLButtonElement>;

    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });
});
