import React from "react";
import { render, screen } from "@testing-library/react";
import { SymbolComponent } from "./symbol";
import { DType } from "../../../types/dtypes";

const fakeValue = new DType({ stringValue: "Fake value" });
const stringValue = new DType({ stringValue: "1.54" })
const arrayValue = new DType({ arrayValue: Float64Array.from([2, 0]) })

describe("<Symbol /> from .opi file", (): void => {
  test("label is not shown if showLabel is false", (): void => {
    const symbolProps = {
      showBooleanLabel: false,
      imageFile: "img 1.gif"
    };

    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.queryByText("Fake value")).not.toBeInTheDocument();
  });

  test("label is added", (): void => {
    const symbolProps = {
      showBooleanLabel: true,
      imageFile: "img 1.gif",
      value: fakeValue
    };
    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.getByText("Fake value")).toBeInTheDocument();
  });

  test("matches snapshot", (): void => {
    const symbolProps = {
      showBooleanLabel: true,
      imageFile: "img 1.gif",
      value: fakeValue
    };
    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });
});


describe("<Symbol /> from .bob file", (): void => {
  test("index is not shown if showIndex is false", (): void => {
    const symbolProps = {
      symbols: ["img 1.gif"],
      value: new DType({ stringValue: "0" })
    };

    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  test("index is added", (): void => {
    const symbolProps = {
      showIndex: true,
      symbols: ["img 1.gif", "img 2.png"],
      value: stringValue
    };
    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("use initialIndex if no props value provided", (): void => {
    const symbolProps = {
      showIndex: true,
      initialIndex: 2,
      symbols: ["img 1.gif", "img 2.png", "img 3.svg"],
      value: undefined
    };
    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });
  test("use fallbackSymbol if index out of range or no symbol provided", (): void => {
    const symbolProps = {
      symbols: ["img 1.gif"],
      value: new DType({ doubleValue: 1 })
    };
    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });
  test("use arrayIndex to find index if value is an array", (): void => {
    const symbolProps = {
      arrayIndex: 0,
      symbols: ["img 1.gif", "img 2.png", "img 3.svg"],
      value: arrayValue
    };
    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

});
