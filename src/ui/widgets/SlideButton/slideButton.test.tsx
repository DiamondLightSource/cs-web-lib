import React from "react";
import { SlideButtonComponent } from "./slideButton";
import { act, fireEvent, render } from "@testing-library/react";
import { newDType, DAlarmNONE } from "../../../types/dtypes";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { PvDatum } from "../../../redux/csState";
import { vi } from "vitest";
import * as useSubscription from "../../hooks/useSubscription";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

const mockWritePv = vi
  .spyOn(useSubscription, "writePv")
  .mockImplementation(vi.fn());

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() =>
    createMockStyle({
      colors: {
        color: "rgb(0, 0, 0)",
        backgroundColor: "rgba(255, 255, 255, 1)"
      },
      customColors: {
        onColor: "rgb(0, 235, 10)",
        offColor: "rgb(100, 100, 100)"
      }
    })
  )
}));

vi.mock("../../hooks/useMeasuredSize", () => ({
  useMeasuredSize: (width: number, height: number) => [
    { current: null },
    { width, height }
  ]
}));

beforeEach((): void => {
  mockWritePv.mockReset();
});

const SlideButtonRenderer = (slideButtonProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <SlideButtonComponent {...slideButtonProps} />
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
  label: "toggle button label"
};

describe("<SlideButton />", (): void => {
  test("it renders a switch with default values", (): void => {
    const { getByRole, container } = render(
      SlideButtonRenderer({ pvData: [TEST_PVDATUM] })
    );
    const outerDiv = container.firstChild as HTMLDivElement;

    expect(outerDiv).toHaveStyle({
      "background-color": "rgba(255, 255, 255, 1)",
      height: "40px",
      width: "120px"
    });
    expect(getByRole("switch")).toBeTruthy();
  });

  test("it renders label and reflects PV on-state", (): void => {
    const { getByRole, getByText } = render(SlideButtonRenderer(TEST_PROPS));

    expect((getByRole("switch") as HTMLInputElement).checked).toBe(true);
    expect(getByText("toggle button label")).toBeTruthy();
  });

  test("it is unchecked when PV value is 0", (): void => {
    const offProps = {
      ...TEST_PROPS,
      pvData: [{ ...TEST_PVDATUM, value: newDType({ doubleValue: 0 }) }]
    };
    const { getByRole } = render(SlideButtonRenderer(offProps));

    expect((getByRole("switch") as HTMLInputElement).checked).toBe(false);
  });

  test("it writes to pv on toggle", async (): Promise<void> => {
    const { getByRole } = render(SlideButtonRenderer(TEST_PROPS));

    await act(async () => {
      fireEvent.click(getByRole("switch"));
    });

    expect(mockWritePv).toHaveBeenCalledWith(
      "TEST:PV",
      newDType({ doubleValue: 0 })
    );
  });

  test("it is disabled when readOnly is true", (): void => {
    const readOnlyProps = {
      ...TEST_PROPS,
      pvData: [{ ...TEST_PVDATUM, readonly: true }]
    };
    const { getByRole, container } = render(SlideButtonRenderer(readOnlyProps));
    const outerDiv = container.firstChild as HTMLDivElement;

    expect(getByRole("switch")).toBeDisabled();
    expect(outerDiv).toHaveStyle({ cursor: "not-allowed" });
  });

  test("it is disabled when enabled is false", (): void => {
    const { getByRole } = render(
      SlideButtonRenderer({ ...TEST_PROPS, enabled: false })
    );

    expect(getByRole("switch")).toBeDisabled();
  });
});
