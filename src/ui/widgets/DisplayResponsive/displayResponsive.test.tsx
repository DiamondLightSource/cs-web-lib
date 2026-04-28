import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DisplayResponsiveComponent } from "./displayResponsive";

let capturedLayouts: any;
let capturedBreakpoints: any;
let capturedCols: any;
let capturedDragEnabled: boolean | undefined;
let capturedResizeEnabled: boolean | undefined;

vi.mock("react-grid-layout", async () => {
  const actual = await vi.importActual<any>("react-grid-layout");

  return {
    ...actual,

    Responsive: ({
      children,
      layouts,
      breakpoints,
      cols,
      dragConfig,
      resizeConfig
    }: any) => {
      capturedLayouts = layouts;
      capturedBreakpoints = breakpoints;
      capturedCols = cols;
      capturedDragEnabled = dragConfig?.enabled;
      capturedResizeEnabled = resizeConfig?.enabled;

      return <div data-testid="rgl-responsive">{children}</div>;
    },

    useContainerWidth: () => ({
      width: 1200,
      mounted: true,
      containerRef: { current: null }
    })
  };
});

const MockWidget = ({ id }: { id: string }) => (
  <div data-testid={`widget-${id}`}>Widget {id}</div>
);

beforeEach(() => {
  capturedLayouts = undefined;
  capturedBreakpoints = undefined;
  capturedCols = undefined;
  capturedDragEnabled = undefined;
  capturedResizeEnabled = undefined;
});

describe("DisplayResponsiveComponent – high‑value behaviors", () => {
  it("renders the responsive container and grid when mounted", () => {
    render(
      <DisplayResponsiveComponent id="display-1">
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(
      document.querySelector(".display-responsive-container")
    ).toBeInTheDocument();

    expect(screen.getByTestId("rgl-responsive")).toBeInTheDocument();
  });

  it("throws an error if a child widget has no id", () => {
    const BrokenWidget = () => <div />;

    expect(() =>
      render(
        <DisplayResponsiveComponent id="display-1">
          <BrokenWidget />
        </DisplayResponsiveComponent>
      )
    ).toThrow("All grid items must have a stable id");
  });

  it("computes default layouts when responsiveLayouts are not provided", () => {
    render(
      <DisplayResponsiveComponent id="display-1">
        <MockWidget id="a" />
        <MockWidget id="b" />
      </DisplayResponsiveComponent>
    );

    expect(capturedLayouts).toBeDefined();
    expect(capturedLayouts.lg).toHaveLength(2);

    expect(capturedLayouts.lg[0]).toMatchObject({
      i: "a",
      w: 8,
      h: 4
    });

    expect(capturedLayouts.lg[1]).toMatchObject({
      i: "b",
      w: 8,
      h: 4
    });
  });

  it("honors provided responsiveLayouts values", () => {
    const customLayouts = {
      lg: [{ i: "a", x: 1, y: 2, w: 4, h: 3 }]
    };

    render(
      <DisplayResponsiveComponent
        id="display-1"
        responsiveLayouts={customLayouts}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(capturedLayouts.lg).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          i: "a",
          x: 1,
          y: 2,
          w: 4,
          h: 3
        })
      ])
    );
  });

  it("merges responsiveBreakpoints and responsiveColumns with defaults", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        responsiveBreakpoints={{ md: 700 }}
        responsiveColumns={{ sm: 4 }}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(capturedBreakpoints.lg).toBeDefined();
    expect(capturedBreakpoints.md).toBe(700);

    expect(capturedCols.lg).toBeDefined();
    expect(capturedCols.sm).toBe(4);
  });

  it("respects responsiveDragEnabled and responsiveResizeEnabled props", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        responsiveDragEnabled={false}
        responsiveResizeEnabled={false}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(capturedDragEnabled).toBe(false);
    expect(capturedResizeEnabled).toBe(false);
  });
});
