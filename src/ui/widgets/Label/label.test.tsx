import React from "react";
import { LabelComponent } from "./label";
import { render, screen } from "@testing-library/react";

describe("<Label />", (): void => {
  test("it matches the snapshot", (): void => {
    const { asFragment } = render(<LabelComponent text="hello" />);
    expect(asFragment()).toMatchSnapshot();
  });

  test("it renders a basic element", (): void => {
    render(<LabelComponent text="hello" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  test("it handles transparent prop", (): void => {
    const { asFragment } = render(
      <LabelComponent text="hello" transparent={true} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
