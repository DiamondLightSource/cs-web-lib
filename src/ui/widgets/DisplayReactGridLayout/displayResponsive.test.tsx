import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DisplayResponsiveComponent } from "./displayResponsive";
import { displayInstanceSetResponsiveLayout } from "../../../redux/slices/fileCacheSlice";
import { calculateDefaultLayoutWithHorizontalCompactor } from "./displayLayoutUtilities";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

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

let dispatchMock: any;

vi.mock("react-redux", () => ({
  useDispatch: () => {
    dispatchMock = vi.fn();
    return dispatchMock;
  },
  useSelector: (selector: any) =>
    selector({
      csState: {
        files: {}
      }
    })
}));

vi.mock("./displayLayoutUtilities", async () => {
  const actual = await vi.importActual<any>("./displayLayoutUtilities");

  return {
    ...actual,
    calculateDefaultLayoutWithHorizontalCompactor: vi.fn(() => [
      { i: "mock", x: 0, y: 0, w: 1, h: 1 }
    ])
  };
});

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(props =>
    createMockStyle({
      newProps: props
    })
  )
}));

const MockWidget = ({ id }: { id: string }) => (
  <div data-testid={`widget-${id}`}>Widget {id}</div>
);

beforeEach(() => {
  capturedLayouts = undefined;
  capturedBreakpoints = undefined;
  capturedCols = undefined;
  capturedDragEnabled = undefined;
  capturedResizeEnabled = undefined;
  vi.clearAllMocks();
});

describe("DisplayResponsiveComponent – high‑value behaviors", () => {
  it("renders the responsive container and grid when mounted", () => {
    const layouts = {
      lg: [
        { i: "a", x: 0, y: 0, w: 4, h: 3 },
        { i: "b", x: 2, y: 0, w: 8, h: 4 }
      ]
    };

    const responsiveBreakpoints = {
      lg: 12
    };

    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveBreakpoints={responsiveBreakpoints}
        responsiveLayouts={layouts}
      >
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
        <DisplayResponsiveComponent
          id="display-1"
          fileId="file-1"
          embeddedDisplayUuid="uuid1"
        >
          <BrokenWidget />
        </DisplayResponsiveComponent>
      )
    ).toThrow("All grid items must have a stable id");
  });

  it("computes default layouts when responsiveLayouts are not provided", () => {
    const layouts = {
      lg: [
        { i: "a", x: 0, y: 0, w: 4, h: 3 },
        { i: "b", x: 2, y: 0, w: 8, h: 4 }
      ]
    };

    const responsiveBreakpoints = {
      lg: 12
    };

    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveBreakpoints={responsiveBreakpoints}
        responsiveLayouts={layouts}
      >
        <MockWidget id="a" />
        <MockWidget id="b" />
      </DisplayResponsiveComponent>
    );

    expect(capturedLayouts).toBeDefined();
    expect(capturedLayouts.lg).toHaveLength(2);

    expect(capturedLayouts.lg[0]).toMatchObject({
      i: "a",
      w: 4,
      h: 3
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
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
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
    const layouts = {
      md: [{ i: "a", x: 0, y: 0, w: 4, h: 3 }]
    };

    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveLayouts={layouts}
        responsiveBreakpoints={{ md: 700 }}
        responsiveColumns={{ md: 4 }}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(capturedBreakpoints.lg).not.toBeDefined();
    expect(capturedBreakpoints.md).toBe(700);

    expect(capturedCols.lg).not.toBeDefined();
    expect(capturedCols.md).toBe(4);
  });

  it("respects gridCellDragEnabled and gridCellResizeEnabled props", () => {
    const layouts = {
      lg: [{ i: "a", x: 0, y: 0, w: 4, h: 3 }]
    };

    const responsiveBreakpoints = {
      lg: 12
    };

    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveLayouts={layouts}
        responsiveBreakpoints={responsiveBreakpoints}
        gridCellDragEnabled={false}
        gridCellResizeEnabled={false}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(capturedDragEnabled).toBe(false);
    expect(capturedResizeEnabled).toBe(false);
  });

  it("dispatches fallback layouts when responsiveLayouts keys are inconsistent", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveLayouts={{
          md: [{ i: "a", x: 0, y: 0, w: 2, h: 2 }]
        }}
        responsiveBreakpoints={{ lg: 1200 }}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(dispatchMock).toHaveBeenCalledTimes(1);

    const dispatchedArg = dispatchMock.mock.calls[0][0];

    expect(dispatchedArg).toEqual(
      displayInstanceSetResponsiveLayout(
        expect.objectContaining({
          displayId: "display-1",
          embeddedDisplayUuid: "uuid1",
          responsiveLayouts: {
            lg: expect.any(Array)
          }
        })
      )
    );
  });

  it("dispatches fallback columns when responsiveColumns keys are inconsistent", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveLayouts={{
          lg: [{ i: "a", x: 0, y: 0, w: 2, h: 2 }]
        }}
        responsiveBreakpoints={{ lg: 1200 }}
        responsiveColumns={{ md: 4 }}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    const dispatchedArg = dispatchMock.mock.calls[0][0];

    expect(dispatchedArg.payload.responsiveColumns.lg).toBeDefined();
    expect(dispatchedArg.payload.responsiveColumns.md).toBeUndefined();
  });

  it("uses fallback layout generator when layouts not specified", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    expect(calculateDefaultLayoutWithHorizontalCompactor).toHaveBeenCalledTimes(
      5
    );

    [1200, 800, 600, 400, 250].forEach(cols => {
      expect(
        calculateDefaultLayoutWithHorizontalCompactor
      ).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            props: expect.objectContaining({ id: "a" })
          })
        ]),
        cols,
        Math.round((cols - 6) / (44 + 6)),
        [6, 6],
        15
      );
    });

    const dispatchedArg = dispatchMock.mock.calls[0][0];
    expect(dispatchedArg.payload.responsiveLayouts.lg).toEqual([
      { i: "mock", x: 0, y: 0, w: 1, h: 1 }
    ]);
  });

  it("uses fallback layout generator when configs are inconsistent", () => {
    render(
      <DisplayResponsiveComponent
        id="display-1"
        fileId="file-1"
        embeddedDisplayUuid="uuid1"
        responsiveLayouts={{ md: [] }}
        responsiveBreakpoints={{ lg: 1150 }}
        gridCellMargins={[3, 7]}
        gridCellHeight={24}
      >
        <MockWidget id="a" />
      </DisplayResponsiveComponent>
    );

    const expectedCols = Math.round((1150 - 3) / (44 + 3));

    expect(calculateDefaultLayoutWithHorizontalCompactor).toHaveBeenCalled();
    expect(calculateDefaultLayoutWithHorizontalCompactor).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          props: expect.objectContaining({ id: "a" })
        })
      ]),
      1150,
      expectedCols,
      [3, 7],
      24
    );

    const dispatchedArg = dispatchMock.mock.calls[0][0];
    expect(dispatchedArg.payload.responsiveLayouts.lg).toEqual([
      { i: "mock", x: 0, y: 0, w: 1, h: 1 }
    ]);
  });
});
