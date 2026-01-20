import React from "react";
import { MenuButtonComponent } from "./menuButton";
import { DAlarm, DType, DDisplay } from "../../../types/dtypes";
import { ACTIONS_EX_FIRST } from "../../../testResources";
import { act, fireEvent, render } from "@testing-library/react";
import { vi } from "vitest";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { PvDatum } from "../../../redux/csState";
import * as useSubscription from "../../hooks/useSubscription";

const mockWritePv = vi
  .spyOn(useSubscription, "writePv")
  .mockImplementation(vi.fn());

beforeEach((): void => {
  mockWritePv.mockReset();
});

const BASE_PROPS = {
  enabled: true,
  pvData: [
    {
      effectivePvName: "TEST:PV",
      connected: true,
      readonly: false,
      value: {
        getStringValue: () => "zero",
        getTime: () => {
          new Date(Date.now());
        },
        alarm: DAlarm.NONE,
        display: new DDisplay({
          choices: ["zero", "one", "two", "three", "four", "five"]
        })
      } as Partial<DType> as DType
    } as Partial<PvDatum> as PvDatum
  ]
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
    const { asFragment } = render(MenuButtonRenderer(BASE_PROPS));
    expect(asFragment()).toMatchSnapshot();
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

    expect(options[1].textContent).toEqual("Item 2");
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
    expect(select.firstChild?.textContent).toEqual("zero");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    // Two actions plus options plus label.
    expect(options.length).toBe(7);
  });

  test("it renders the option with the correct index", (): void => {
    const props = {
      ...BASE_PROPS,
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: false,
          value: {
            getStringValue: () => "five",
            getTime: () => {
              new Date(Date.now());
            },
            alarm: DAlarm.NONE,
            display: new DDisplay({
              choices: ["zero", "one", "two", "three", "four", "five"]
            })
          } as Partial<DType> as DType
        } as Partial<PvDatum> as PvDatum
      ]
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    expect(select).toHaveTextContent("five");
    expect(options[5]).toHaveFocus();
  });

  test("it triggers the correct action if pv and widget values differ", async (): Promise<void> => {
    const props = {
      ...BASE_PROPS,
      items: ["zero", "one", "two"],
      itemsFromPv: false,
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: false,
          value: {
            getStringValue: () => "one",
            getTime: () => {
              new Date(Date.now());
            },
            alarm: DAlarm.NONE,
            display: new DDisplay({
              choices: ["one", "two"]
            })
          } as Partial<DType> as DType
        } as Partial<PvDatum> as PvDatum
      ]
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");
    expect(select).toHaveTextContent("one");
    expect(options[1]).toHaveFocus();

    await act(async () => {
      fireEvent.click(options[2]);
    });

    expect(mockWritePv).toHaveBeenCalledWith(
      "TEST:PV",
      new DType({ stringValue: "two" })
    );
  });

  test("function called on click", async (): Promise<void> => {
    const props = {
      ...BASE_PROPS,
      actionsFromPv: false,
      actions: ACTIONS_EX_FIRST,
      label: "menu button with label"
    };
    const { getAllByRole, getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    const options = getAllByRole("option");

    expect(options[1]).toHaveFocus();

    await act(async () => {
      fireEvent.click(options[2]);
    });

    expect(mockWritePv).toHaveBeenCalledWith(
      "TEST:PV",
      new DType({ stringValue: "one" })
    );
  });

  test("the widget is disabled", (): void => {
    const props = {
      ...BASE_PROPS,
      enabled: false
    };
    const { getByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    expect(select).toHaveAttribute("aria-disabled");
  });

  test("it defaults to `No PV` value if no PV", (): void => {
    const props = {
      ...BASE_PROPS,
      items: ["zero", "one", "two"],
      pvData: [
        {
          effectivePvName: undefined,
          connected: false,
          readonly: false,
          value: {
            getStringValue: () => undefined,
            getTime: () => {
              new Date(Date.now());
            },
            alarm: DAlarm.NONE,
            display: new DDisplay({
              choices: ["one", "two"]
            })
          } as Partial<DType> as DType
        } as Partial<PvDatum> as PvDatum
      ],
      itemsfromPv: false
    };
    const { getByRole, getAllByRole } = render(MenuButtonRenderer(props));
    const select = getByRole("combobox");
    fireEvent.mouseDown(select);
    //expect(select).toHaveTextContent("No PV");
    const options = getAllByRole("option");
    expect(options[0]).toHaveTextContent("No PV");
    expect(options[0]).toHaveFocus();
  });
});
