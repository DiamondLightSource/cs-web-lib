import React from "react";
import { BoolButtonComponent, getDimensions } from "./boolButton";
import { act, fireEvent, render } from "@testing-library/react";
import { newDType, DAlarmNONE } from "../../../types/dtypes";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { PvDatum } from "../../../redux/csState";
import { vi } from "vitest";
import * as useSubscription from "../../hooks/useSubscription";
import { ColorUtils } from "../../../types/color";

const mockWritePv = vi
  .spyOn(useSubscription, "writePv")
  .mockImplementation(vi.fn());

beforeEach((): void => {
  mockWritePv.mockReset();
});

const BoolButtonRenderer = (boolButtonProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <BoolButtonComponent {...boolButtonProps} />
    </ThemeProvider>
  );
};

const TEST_PVDATUM = {
  effectivePvName: "TEST:PV",
  connected: true,
  readonly: false,
  value: newDType({ doubleValue: 1 }, DAlarmNONE())
} as Partial<PvDatum> as PvDatum;

const TEST_PROPS = {
  pvData: [TEST_PVDATUM],
  width: 45,
  height: 20,
  onColor: ColorUtils.fromRgba(0, 235, 10),
  offColor: ColorUtils.fromRgba(0, 100, 0),
  onLabel: "Enabled",
  offLabel: "Disabled",
  squareButton: true,
  backgroundColor: ColorUtils.fromRgba(20, 20, 200),
  foregroundColor: ColorUtils.fromRgba(10, 60, 40),
  showBooleanLabel: true,
  onState: 1,
  offState: 0
};

describe("<BoolButton />", (): void => {
  test("it renders a button with default values", (): void => {
    const boolButtonProps = {
      pvData: [TEST_PVDATUM]
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    const spanElement = button.firstChild as HTMLSpanElement;
    const led = spanElement.children[0] as HTMLSpanElement;

    expect(button).toHaveStyle({
      "background-color": "rgb(210, 210, 210)",
      height: "100%",
      width: "100%",
      borderRadius: ""
    });

    expect(led.style.backgroundColor).toEqual("rgb(0, 255, 0)");
    expect(led.style.height).toEqual("16px");
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

    expect(button.textContent).toEqual("Enabled");
    expect(led.className).toContain("Led");
    expect(led.style.backgroundColor).toEqual("rgb(0, 235, 10)");
    expect(led.style.height).toEqual("11px");

    expect(button).toHaveStyle({
      "background-color": "rgb(20, 20, 200)",
      height: "100%",
      width: "100%",
      borderRadius: ""
    });
  });

  test("no text if showboolean is false", (): void => {
    const boolButtonProps = {
      pvData: [{ ...TEST_PVDATUM, value: newDType({ doubleValue: 0 }) }],
      showBooleanLabel: false,
      onState: 1,
      offState: 0
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;

    expect(button.textContent).toEqual("");
    expect(button).toHaveStyle("background-color: rgb(210, 210, 210)");
  });

  test("it changes background colour if no LED", async (): Promise<void> => {
    const boolButtonProps = {
      ...TEST_PROPS,
      showLed: false
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;

    // Original on values
    expect(button).toHaveStyle("background-color: rgb(0, 235, 10)");
  });

  test("it writes to pv on click", async (): Promise<void> => {
    const boolButtonProps = {
      ...TEST_PROPS,
      showLed: true
    };
    const { getByRole } = render(BoolButtonRenderer(boolButtonProps));
    const button = getByRole("button") as HTMLButtonElement;
    const spanElement = button.firstChild as HTMLSpanElement;
    const led = spanElement.children[0] as HTMLSpanElement;
    // Original on values
    expect(button.textContent).toEqual("Enabled");
    expect(led.style.backgroundColor).toEqual("rgb(0, 235, 10)");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockWritePv).toHaveBeenCalledWith(
      "TEST:PV",
      newDType({ doubleValue: 0 })
    );
  });
});

describe("getDimensions()", (): void => {
  test("it calculates correct dimensions if width > height", (): void => {
    const diameter = getDimensions(200, 20);

    expect(diameter).toEqual(11);
  });

  test("it calculates correct dimensions if height > width", (): void => {
    const diameter = getDimensions(30, 70);

    expect(diameter).toEqual(16);
  });
});
