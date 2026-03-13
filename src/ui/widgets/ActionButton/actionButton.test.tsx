import React from "react";
import { ActionButtonComponent } from "./actionButton";
import renderer from "react-test-renderer";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { contextRender, WRITE_PV_ACTION } from "../../../testResources";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { ColorUtils } from "../../../types/color";
import { createMockStyle } from "../../../test-utils/styleTestUtils";
import * as useSubscription from "../../hooks/useSubscription";

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() => createMockStyle())
}));

const mockWritePv = vi
  .spyOn(useSubscription, "writePv")
  .mockImplementation(vi.fn());

// Pass the theme in with the component to access default values
const actionButton = (props: any, text = "hello") => (
  <ThemeProvider theme={phoebusTheme}>
    <ActionButtonComponent
      text={text}
      actions={{ actions: [WRITE_PV_ACTION] }}
      {...props}
    />
  </ThemeProvider>
);

describe("<ActionButton />", (): void => {
  test("it matches the snapshot", (): void => {
    const snapshot = renderer.create(actionButton({}));
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test("it renders a button with default style from theme", (): void => {
    const { getByRole } = contextRender(actionButton({}));
    const button = getByRole("button");
    expect(button).toHaveStyle({
      "background-color": "rgb(0, 0, 0)",
      color: "rgb(155, 160, 209)",
      width: "100px",
      height: "30px"
    });
    // For some reason, background colour doesn't like to be passed as an object so pass as string
    expect(button.textContent).toEqual("hello");
  });

  test("it renders a button with style from props", (): void => {
    const { getByRole } = render(
      actionButton({
        foregroundColor: ColorUtils.fromRgba(155, 160, 209),
        backgroundColor: ColorUtils.fromRgba(10, 200, 1),
        height: 40,
        width: 60
      })
    );
    const button = getByRole("button");
    expect(button).toHaveStyle({
      "background-color": "rgb(0, 0, 0)",
      color: "rgb(155, 160, 209)",
      width: "60px",
      height: "40px"
    });
    // For some reason, background colour doesn't like to be passed as an object so pass as string
  });

  test("button is rotated correctly when rotationStep is set", async () => {
    const { getByRole } = render(
      actionButton({ rotationStep: 1, height: 40, width: 60 })
    );
    const button = await getByRole("button");
    expect(button).toHaveStyle({
      transform: "rotate(-90deg) translateY(10px) translateX(10px)",
      height: "60px",
      width: "40px"
    });
  });

  test("whether button is disabled", async () => {
    const { getByRole } = render(actionButton({ enabled: false }));
    const button = await getByRole("button");
    expect(button).toBeDisabled();
  });

  test("function called on click", async (): Promise<void> => {
    const { getByRole } = render(actionButton({}));
    const button = getByRole("button") as HTMLButtonElement;
    fireEvent.click(button);
    await waitFor(() => expect(mockWritePv).toHaveBeenCalled());
  });
});
