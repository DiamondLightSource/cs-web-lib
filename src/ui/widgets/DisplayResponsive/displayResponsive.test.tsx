import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DisplayResponsiveComponent } from "./displayResponsive";

vi.mock("react-grid-layout", async () => {
  const actual = await vi.importActual<any>("react-grid-layout");

  return {
    ...actual,

    Responsive: ({ children }: any) => (
      <div data-testid="rgl-responsive">{children}</div>
    ),

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

describe("DisplayResponsiveComponent", () => {
  it("renders the responsive container", () => {
    render(
      <DisplayResponsiveComponent id="display-1">
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    const container = document.querySelector(".display-responsive-container");

    expect(container).toBeTruthy();
  });

  it("renders the Responsive grid when mounted", () => {
    render(
      <DisplayResponsiveComponent id="display-1">
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(screen.getByTestId("rgl-responsive")).toBeInTheDocument();
  });

  it("renders child widgets", () => {
    render(
      <DisplayResponsiveComponent id="display-1">
        <MockWidget id="a" />
        <MockWidget id="b" />
      </DisplayResponsiveComponent>
    );

    expect(screen.getByTestId("widget-a")).toBeInTheDocument();
    expect(screen.getByTestId("widget-b")).toBeInTheDocument();
  });

  it("wraps each child in a grid item div", () => {
    render(
      <DisplayResponsiveComponent id="display-1">
        <MockWidget id="a" />
        <MockWidget id="b" />
      </DisplayResponsiveComponent>
    );

    const grid = screen.getByTestId("rgl-responsive");

    expect(grid.children.length).toBe(2);

    expect(grid.children[0].firstElementChild).toHaveAttribute(
      "data-testid",
      "widget-a"
    );

    expect(grid.children[1].firstElementChild).toHaveAttribute(
      "data-testid",
      "widget-b"
    );
  });

  it("accepts responsive configuration props", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        responsiveBreakpoints={{ lg: 1000, sm: 0 }}
        responsiveColumns={{ lg: 10, sm: 4 }}
        responsiveCellMargins={[8, 8]}
        rowHeight="20"
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(screen.getByTestId("widget-a")).toBeInTheDocument();
  });
});
