import React from "react";
import { DisplayComponent } from "./display";
import { Label } from "../Label/label";
import { newRelativePosition } from "../../../types/position";
import { contextRender } from "../../../testResources";

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
