import React from "react";
import { MenuButtonComponent } from "./menuButton";
import { create } from "react-test-renderer";
import { dtimeNow, DAlarm, DType, DDisplay } from "../../../types/dtypes";
import {
  ACTIONS_EX_FIRST,
  WRITE_PV_ACTION_NO_DESC
} from "../../../testResources";
import { act, fireEvent, render } from "@testing-library/react";
import { vi } from "vitest";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";

const mock = vi.fn();
beforeEach((): void => {
  mock.mockReset();
});

const BASE_PROPS = {
  connected: true,
  onChange: mock,
  enabled: true,
  pvName: "testpv",
  actionsFromPv: true,
  value: new DType(
    { doubleValue: 0 },
    DAlarm.NONE,
    dtimeNow(),
    new DDisplay({
      choices: ["zero", "one", "two", "three", "four", "five"]
    })
  )
};

const MenuButtonRenderer = (menuButtonProps: any): JSX.Element => {
  return (
    <ThemeProvider theme={phoebusTheme}>
      <MenuButtonComponent {...menuButtonProps} />
    </ThemeProvider>
  );
};

describe("<MenuButton />", (): void => {
  test("it matches the snapshot", (): void => {
    const snapshot = create(MenuButtonRenderer(BASE_PROPS));
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test("it renders with default style", (): void => {
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(BASE_PROPS));
    const trigger = getByRole("combobox");
    fireEvent.mouseDown(trigger);
    const options = getAllByRole("option");

    options.forEach(option => {
      expect(option).toHaveStyle({
        color: "rgb(0, 0, 0)"
      });
    });

    expect(options[0].textContent).toEqual("zero");
  });

  test("it renders with style from props", (): void => {
    const props = {
      ...BASE_PROPS,
      backgroundColor: "rgb(10, 240, 60)",
      foregroundColor: "rgb(11, 16, 11)",
      itemsFromPv: false
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const trigger = getByRole("combobox");
    fireEvent.mouseDown(trigger);
    const options = getAllByRole("option");

    options.forEach(option => {
      expect(option).toHaveStyle({
        color: "rgb(11, 16, 11)"
      });
    });

    expect(options[0].textContent).toEqual("Item 1");
  });

  test("it renders all the choices", (): void => {
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(BASE_PROPS));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    expect(options.length).toBe(6);
  });

  test("it renders actions", (): void => {
    const props = {
      ...BASE_PROPS,
      actionsFromPv: false,
      actions: ACTIONS_EX_FIRST,
      label: "menu button with label"
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    expect(select.firstChild?.textContent).toEqual("Item 1");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    // Two actions plus label.
    expect(options.length).toBe(3);
  });

  test("it renders the option with the correct index", (): void => {
    const props = {
      ...BASE_PROPS,
      value: new DType(
        { doubleValue: 5 },
        DAlarm.NONE,
        dtimeNow(),
        new DDisplay({
          choices: ["zero", "one", "two", "three", "four", "five"]
        })
      )
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    expect(options[5]).toHaveFocus();
  });

  test("function called on click", (): void => {
    const props = {
      ...BASE_PROPS,
      actionsFromPv: false,
      actions: ACTIONS_EX_FIRST,
      label: "menu button with label"
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const trigger = getByRole("combobox");
    fireEvent.mouseDown(trigger);
    const options = getAllByRole("option");

    expect(options[1]).toHaveFocus();

    act(() => {
      options[2].click();
    });
    expect(mock).toHaveBeenCalledWith(WRITE_PV_ACTION_NO_DESC);
  });

  test("widget is disabled", (): void => {
    const props = {
      ...BASE_PROPS,
      enabled: false
    };
    const { getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    expect(select).toHaveAttribute("aria-disabled");
  });
});
