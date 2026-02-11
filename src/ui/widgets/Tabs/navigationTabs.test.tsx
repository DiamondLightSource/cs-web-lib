import React from "react";

import { fireEvent, act } from "@testing-library/react";
import { NavigationTabsComponent } from "./navigationTabs";
import { Provider } from "react-redux";
import { store } from "../../../redux/store";
import { ensureWidgetsRegistered } from "..";
import { contextRender } from "../../../testResources";
import { vi } from "vitest";
import { ThemeProvider } from "@mui/material";
import { phoebusTheme } from "../../../phoebusTheme";
import { ColorUtils } from "../../../types";
ensureWidgetsRegistered();

const navigationTab = (
  props: any,
  tabs = [
    { name: "one", file: "test.bob" },
    { name: "two", file: "second.bob" }
  ]
) => (
  <Provider store={store()}>
    <ThemeProvider theme={phoebusTheme}>
      <NavigationTabsComponent {...props} tabs={tabs} />
    </ThemeProvider>
  </Provider>
);

describe("<NavigationTabs>", (): void => {
  const mockFirstResponse = `
    <?xml version="1.0" encoding="UTF-8"?>
    <display version="2.0.0">
        <name>Display</name>
        <width>200</width>
        <height>350</height>
        <widget type="label" version="2.0.0">
            <name>Label</name>
            <text>Hello!</text>
            <x>30</x>
            <y>10</y>
            <width>140</width>
        </widget>
    </display>`;

  const mockSecondResponse = `
    <?xml version="1.0" encoding="UTF-8"?>
    <display version="2.0.0">
        <name>Display</name>
        <width>200</width>
        <height>350</height>
        <widget type="label" version="2.0.0">
            <name>Label</name>
            <text>Goodbye!</text>
            <x>30</x>
            <y>10</y>
            <width>140</width>
        </widget>
    </display>`;

  beforeEach((): void => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "test.bob") {
          return Promise.resolve({
            text: (): Promise<unknown> => Promise.resolve(mockFirstResponse)
          } as Response);
        }

        if (url === "second.bob") {
          return Promise.resolve({
            text: (): Promise<unknown> => Promise.resolve(mockSecondResponse)
          } as Response);
        }

        return Promise.reject(new Error("Unknown URL"));
      })
    );
  });

  it("renders with default appearance", async () => {
    const { findByText, getByRole } = await act(() => {
      return contextRender(navigationTab({}));
    });

    const selectedTab = getByRole("tab", { selected: true });
    expect(selectedTab).toHaveTextContent("one");
    expect(await findByText("Hello!")).toBeInTheDocument();
    const selectedStyle = getComputedStyle(selectedTab);
    expect(selectedStyle.backgroundColor).toBe("rgb(236, 236, 236)");
    expect(selectedStyle.minWidth).toBe("100px");
    expect(selectedStyle.minHeight).toBe("30px");
    expect(selectedStyle.marginBottom).toBe("2px");

    const deselectedTab = getByRole("tab", { selected: false });
    const deselectedStyle = getComputedStyle(deselectedTab);
    expect(deselectedStyle.backgroundColor).toBe("rgb(200, 200, 200)");
  });

  it("renders with different tab spacing and colours", async () => {
    const { getByRole } = await act(() => {
      return contextRender(
        navigationTab({
          direction: 0,
          selectedColor: ColorUtils.fromRgba(255, 99, 71),
          deselectedColor: ColorUtils.fromRgba(60, 179, 113),
          tabSpacing: 10,
          tabHeight: 20,
          tabWidth: 40
        })
      );
    });
    const selectedTab = getByRole("tab", { selected: true });
    expect(selectedTab).toHaveTextContent("one");
    const selectedStyle = getComputedStyle(selectedTab);
    expect(selectedStyle.backgroundColor).toBe("rgb(255, 99, 71)");
    expect(selectedStyle.minWidth).toBe("40px");
    expect(selectedStyle.minHeight).toBe("20px");
    expect(selectedStyle.marginRight).toBe("10px");

    const deselectedTab = getByRole("tab", { selected: false });
    const deselectedStyle = getComputedStyle(deselectedTab);
    expect(deselectedStyle.backgroundColor).toBe("rgb(60, 179, 113)");
  });

  it("opens on the second tab", async () => {
    const { findByText, getByRole } = await act(() => {
      return contextRender(navigationTab({ activeTab: 1 }));
    });

    expect(getByRole("tab", { selected: true })).toHaveTextContent("two");
    expect(await findByText("Goodbye!")).toBeInTheDocument();
  });

  it("changes the direction of the tabs", async () => {
    const { getByRole } = await act(() => {
      return contextRender(navigationTab({ direction: 1 }));
    });

    const tablist = getByRole("tablist");
    expect(tablist).toHaveAttribute("aria-orientation", "vertical");
  });

  it("changes tabs on click", async () => {
    // fetchSpy
    //   .mockImplementationOnce(mockFirstFetch)
    //   .mockImplementationOnce(mockSecondFetch);
    const { getAllByRole, getByRole, findByText } = await act(() => {
      return contextRender(navigationTab({}));
    });

    const tabs = getAllByRole("tab");

    expect(getByRole("tab", { selected: true })).toHaveTextContent("one");
    expect(await findByText("Hello!")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(tabs[1] as HTMLDivElement);
    });

    expect(getByRole("tab", { selected: true })).toHaveTextContent("two");
    expect(await findByText("Goodbye!")).toBeInTheDocument();
  });
});
