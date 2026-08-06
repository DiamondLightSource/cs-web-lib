import React from "react";
import { GroupBoxComponent } from "./groupBox";
import { ColorUtils } from "../../../types/color";
import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

const testStore = configureStore({
  reducer: {
    style: (state = { classes: {}, currentClass: "DEFAULT" }) => state
  }
});

describe("<GroupBoxComponent /> snapshots", (): void => {
  test("it matches the snapshot for Group Box style", (): void => {
    const { asFragment } = render(
      <Provider store={testStore}>
        <GroupBoxComponent
          name={"Test"}
          backgroundColor={ColorUtils.WHITE}
          styleOpt={0}
        />
      </Provider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test("it matches the snapshot for Title Bar style", (): void => {
    const { asFragment } = render(
      <Provider store={testStore}>
        <GroupBoxComponent name={"Title"} styleOpt={1} />
      </Provider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test("it matches the snapshot for Line style", (): void => {
    const { asFragment } = render(
      <Provider store={testStore}>
        <GroupBoxComponent name={"No Title"} styleOpt={2} />
      </Provider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test("it matches the snapshot for no style", (): void => {
    const { asFragment } = render(
      <Provider store={testStore}>
        <GroupBoxComponent name={"None"} styleOpt={3} />
      </Provider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("<GroupBoxComponent />", (): void => {
  test("it renders the title", (): void => {
    const grouping = (
      <Provider store={testStore}>
        <GroupBoxComponent name={"Test"} styleOpt={1} />
      </Provider>
    );
    const { getByText } = render(grouping);
    expect(getByText("Test")).toBeInTheDocument();
  });

  test("it renders child div with text", (): void => {
    const childText = "Testing Child Component";
    const groupingWithChild = (
      <Provider store={testStore}>
        <GroupBoxComponent name={"Test"}>
          <div>{childText}</div>
        </GroupBoxComponent>
      </Provider>
    );
    const { getByText } = render(groupingWithChild);
    expect(getByText("Test")).toBeInTheDocument();
  });
});
