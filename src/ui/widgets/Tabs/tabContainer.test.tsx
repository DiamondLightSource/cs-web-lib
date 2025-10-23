import React from "react";
import log from "loglevel";

import { render, fireEvent, act } from "@testing-library/react";
import { TabContainerComponent } from "./tabContainer";
import { Provider } from "react-redux";
import { store } from "../../../redux/store";
import { ensureWidgetsRegistered } from "..";
ensureWidgetsRegistered();

describe("<TabContainer>", (): void => {
  it("renders one child", async () => {
    const child = {
      type: "label",
      position: "relative",
      text: "hello"
    };
    const { findByText } = await act(() => {
      return render(
        <Provider store={store}>
          <TabContainerComponent tabs={{ one: child }} />
        </Provider>
      );
    });
    expect(await findByText("hello")).toBeInTheDocument();
  });
  it("renders error widget for incorrect child", async () => {
    const child = {
      type: "image"
    };
    // Suppress logging for expected error.
    log.setLevel("error");
    const { findByText } = await act(() => {
      return render(
        <Provider store={store}>
          <TabContainerComponent tabs={{ one: child }} />
        </Provider>
      );
    });
    log.setLevel("info");
    expect(await findByText(/Error/)).toBeInTheDocument();
  });
  it("changes tabs on click", async () => {
    const child1 = {
      type: "label",
      position: "relative",
      text: "hello"
    };
    const child2 = {
      type: "label",
      position: "relative",
      text: "bye"
    };

    const { findByText } = await act(() => {
      return render(
        <Provider store={store}>
          <TabContainerComponent tabs={{ one: child1, two: child2 }} />
        </Provider>
      );
    });

    expect(await findByText("hello")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click((await findByText("two")) as HTMLDivElement);
    });

    expect(await findByText("bye")).toBeInTheDocument();
  });
});
