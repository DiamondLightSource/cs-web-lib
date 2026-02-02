import React from "react";
import log from "loglevel";

import { render, fireEvent, act } from "@testing-library/react";
import { TabContainerComponent } from "./tabContainer";
import { Provider } from "react-redux";
import { store } from "../../../redux/store";
import { ensureWidgetsRegistered } from "..";
import { RelativePosition } from "../../../types";
ensureWidgetsRegistered();

describe("<TabContainer>", (): void => {
  it("renders one child", async () => {
    const child = [
      {
        type: "label",
        position: new RelativePosition(),
        text: "hello"
      }
    ];
    const { findByText } = await act(() => {
      return render(
        <Provider store={store()}>
          <TabContainerComponent tabs={[{ name: "one", children: child }]} />
        </Provider>
      );
    });
    expect(await findByText("hello")).toBeInTheDocument();
  });
  it("renders error widget for incorrect child", async () => {
    const child = [
      {
        type: "image",
        position: new RelativePosition()
      }
    ];
    // Suppress logging for expected error.
    log.setLevel("error");
    const { findByText } = await act(() => {
      return render(
        <Provider store={store()}>
          <TabContainerComponent tabs={[{ name: "one", children: child }]} />
        </Provider>
      );
    });
    log.setLevel("info");
    expect(await findByText(/Error/)).toBeInTheDocument();
  });
  it("changes tabs on click", async () => {
    const child1 = [
      {
        type: "label",
        position: new RelativePosition(),
        text: "hello"
      }
    ];
    const child2 = [
      {
        type: "label",
        position: new RelativePosition(),
        text: "bye"
      }
    ];

    const { findByText } = await act(() => {
      return render(
        <Provider store={store()}>
          <TabContainerComponent
            tabs={[
              { name: "one", children: child1 },
              { name: "two", children: child2 }
            ]}
          />
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
