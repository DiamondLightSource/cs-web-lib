import React from "react";
import { DisplayComponent } from "./display";
import { Label } from "../Label/label";
import { newRelativePosition } from "../../../types/position";
import { contextRender } from "../../../testResources";
import { vi } from "vitest";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

vi.mock("../../themeUtils", () => ({
  useStyle: vi.fn(() => createMockStyle())
}));

const display = (
  <DisplayComponent id="id1">
    <Label text="hello" position={newRelativePosition()} />
  </DisplayComponent>
);

describe("<Display />", (): void => {
  const { queryByText } = contextRender(display);
  test("it renders the label", (): void => {
    expect(queryByText("hello")).toBeInTheDocument();
  });
});
