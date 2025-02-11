import React from "react";
import { GroupBoxComponent } from "./groupBox";
import { Color } from "../../../types/color";
import { render } from "@testing-library/react";

describe("<GroupBoxComponent /> snapshots", (): void => {
  test("it matches the snapshot for Group Box style", (): void => {
    const { asFragment } = render(
      <GroupBoxComponent
        name={"Test"}
        backgroundColor={Color.WHITE}
        styleOpt={0}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test("it matches the snapshot for Title Bar style", (): void => {
    const { asFragment } = render(
      <GroupBoxComponent name={"Title"} styleOpt={1} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test("it matches the snapshot for Line style", (): void => {
    const { asFragment } = render(
      <GroupBoxComponent name={"No Title"} styleOpt={2} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test("it matches the snapshot for no style", (): void => {
    const { asFragment } = render(
      <GroupBoxComponent name={"None"} styleOpt={3} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("<GroupBoxComponent />", (): void => {
  test("it renders the title", (): void => {
    const grouping = <GroupBoxComponent name={"Test"} styleOpt={1} />;
    const { getByText } = render(grouping);
    expect(getByText("Test")).toBeInTheDocument();
  });

  test("it renders child div with text", (): void => {
    const childText = "Testing Child Component";
    const groupingWithChild = (
      <GroupBoxComponent name={"Test"}>
        <div>{childText}</div>
      </GroupBoxComponent>
    );
    const { getByText } = render(groupingWithChild);
    expect(getByText("Test")).toBeInTheDocument();
  });
});
