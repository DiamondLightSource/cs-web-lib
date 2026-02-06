import React from "react";
import { render, screen } from "@testing-library/react";
import { SymbolComponent } from "./symbol";
import { newDType } from "../../../types/dtypes/dType";
import { PvDatum } from "../../../redux/csState";

const fakeValue = newDType({ stringValue: "Fake value" });
const stringValue = newDType({ stringValue: "1.54" });
const arrayValue = newDType({ arrayValue: Float64Array.from([2, 0]) });

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
      pvData: [
        {
          value: fakeValue,
          connected: true,
          readonly: false,
          effectivePvName: "pv"
        }
      ]
    };
    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.getByText("Fake value")).toBeInTheDocument();
  });

  test("matches snapshot", (): void => {
    const symbolProps = {
      showBooleanLabel: true,
      imageFile: "img 1.gif",
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: fakeValue
        } as Partial<PvDatum> as PvDatum
      ]
    };
    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  test("matches snapshot (with rotation)", (): void => {
    const symbolProps = {
      showBooleanLabel: false,
      imageFile: "img 1.gif",
      value: fakeValue,
      rotation: 45
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
      value: newDType({ stringValue: "0" })
    };

    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  test("index is added", (): void => {
    const symbolProps = {
      showIndex: true,
      symbols: ["img 1.gif", "img 2.png"],
      pvData: [
        {
          value: stringValue,
          connected: true,
          readonly: false,
          effectivePvName: "pv"
        }
      ]
    };
    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  test("use initialIndex if no props value provided", (): void => {
    const symbolProps = {
      showIndex: true,
      initialIndex: 2,
      symbols: ["img 1.gif", "img 2.png", "img 3.svg"],
      pvData: [
        {
          value: undefined,
          connected: true,
          readonly: false,
          effectivePvName: "pv"
        }
      ]
    };

    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("use arrayIndex to find index if value is an array", (): void => {
    const symbolProps = {
      arrayIndex: 0,
      showIndex: true,
      symbols: ["img 1.gif", "img 2.png", "img 3.svg"],
      pvData: [
        {
          value: arrayValue,
          connected: true,
          readonly: false,
          effectivePvName: "pv"
        }
      ]
    };
    render(<SymbolComponent {...(symbolProps as any)} />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("matches snapshot (without index)", (): void => {
    const symbolProps = {
      symbols: ["img 1.gif"],
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ stringValue: "0" })
        } as Partial<PvDatum> as PvDatum
      ]
    };

    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  test("matches snapshot (with index)", (): void => {
    const symbolProps = {
      symbols: ["img 1.gif", "img 2.png", "img 3.svg"],
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ stringValue: "2" })
        } as Partial<PvDatum> as PvDatum
      ]
    };

    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  test("matches snapshot (using fallback symbol)", (): void => {
    const symbolProps = {
      symbols: ["img 1.gif"],
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 1 })
        } as Partial<PvDatum> as PvDatum
      ]
    };
    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  test("matches snapshot (with rotation)", (): void => {
    const symbolProps = {
      symbols: ["img 1.gif"],
      value: newDType({ stringValue: "0" }),
      rotation: 45
    };

    const { asFragment } = render(
      <SymbolComponent {...(symbolProps as any)} />
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
