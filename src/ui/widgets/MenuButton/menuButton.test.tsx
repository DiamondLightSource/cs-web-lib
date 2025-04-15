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

const mock = vi.fn();
beforeEach((): void => {
  mock.mockReset();
});

function getMenubuttonComponent(
  value?: number,
  readonly?: boolean
): JSX.Element {
  const val = value ?? 0;
  const disabled = readonly ?? false;
  return (
    <MenuButtonComponent
      connected={true}
      value={
        new DType(
          { doubleValue: val },
          DAlarm.NONE,
          dtimeNow(),
          new DDisplay({
            choices: ["zero", "one", "two", "three", "four", "five"]
          })
        )
      }
      readonly={disabled}
      pvName="testpv"
      actionsFromPv={true}
      onChange={mock}
    />
  );
}

const menuButtonActions = (
  <MenuButtonComponent
    connected={false}
    readonly={false}
    actionsFromPv={false}
    actions={ACTIONS_EX_FIRST}
    label="menu button with label"
    onChange={mock}
  />
);

describe("<MenuButton />", (): void => {
  test("it matches the snapshot", (): void => {
    const snapshot = create(getMenubuttonComponent());
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test("it renders all the choices", (): void => {
    const { getAllByRole, getByRole } = render(getMenubuttonComponent());
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    expect(options.length).toBe(6);
  });
  test("it renders actions", (): void => {
    const { getAllByRole, getByRole } = render(menuButtonActions);
    const select = getByRole("combobox");
    expect(select.firstChild?.textContent).toEqual("menu button with label");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    // Two actions plus label.
    expect(options.length).toBe(3);
  });
  test("it renders the option with the correct index", (): void => {
    const { getAllByRole, getByRole } = render(getMenubuttonComponent(5));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    expect(options[5]).toHaveFocus();
  });

  test("function called on click", async (): Promise<void> => {
    const { getAllByRole, getByRole } = render(menuButtonActions);
    const trigger = getByRole("combobox");
    fireEvent.mouseDown(trigger);
    const options = getAllByRole("option");

    expect(options[0]).toHaveFocus();

    act(() => {
      options[2].click();
    });
    expect(mock).toHaveBeenCalledWith(WRITE_PV_ACTION_NO_DESC);
  });
  test("preventDefault called on mousedown when widget is disabled", async (): Promise<void> => {
    const { getByRole } = render(getMenubuttonComponent(0, true));
    const mockPreventDefault = vi.fn();
    const event = new MouseEvent("mousedown", { bubbles: true });
    event.preventDefault = mockPreventDefault;
    fireEvent(getByRole("combobox"), event);
    expect(mockPreventDefault).toHaveBeenCalled();
  });
});
