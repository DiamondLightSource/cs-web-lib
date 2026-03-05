import React from "react";
import { GroupingContainerComponent } from "./groupingContainer";
import { contextRender } from "../../../testResources";
import { create } from "react-test-renderer";
import { vi } from "vitest";

const grouping = <GroupingContainerComponent name={"Test"} />;

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() => ({
    color: undefined,
    backgroundColor: undefined,
    cursor: undefined,
    visibility: undefined
  }))
}));

describe("<GroupingContainerComponent />", (): void => {
  test("it matches the snapshot", (): void => {
    const snapshot = create(grouping);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test("it renders child with text", (): void => {
    const childText = "Testing Child Component";
    const groupingWithChild = (
      <GroupingContainerComponent name={"Test"}>
        <div>{childText}</div>
      </GroupingContainerComponent>
    );
    const { getByText } = contextRender(groupingWithChild);
    expect(getByText(childText)).toBeInTheDocument();
  });
});
