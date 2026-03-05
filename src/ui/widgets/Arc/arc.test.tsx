import React from "react";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { ArcComponent } from "./arc";
import { ColorUtils } from "../../../types/color";
import { vi } from "vitest";
import { createMockStyle } from "../../../test-utils/styleTestUtils";
import { calculateArc, polarToCartesian } from "./arcUtils";

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() =>
    createMockStyle({
      colors: { color: "rgba(0,0,255,1)", backgroundColor: "rgba(200,1,60,1)" }
    })
  )
}));

const ArcRenderer = (arcProps: any): ReactTestRendererJSON => {
  return renderer
    .create(<ArcComponent {...arcProps} />)
    .toJSON() as ReactTestRendererJSON;
};

describe("<ArcComponent />", (): void => {
  test("creating 360 arc correctly", (): void => {
    const arcProps = {
      height: 100,
      width: 100
    };

    const svg = ArcRenderer(arcProps);
    expect(svg.props.viewBox).toEqual("0 0 100 100");

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 98 50 A 48.5 48.5 0 0 1 50 98 L 48.5 48.5 L 98 50"
    );
    expect(pathArray[0].props.fill).toEqual("rgba(200,1,60,1)");
    expect(pathArray[0].props.stroke).toEqual("rgba(0,0,255,1)");
  });

  test("creating arc of angle < 180 degrees using default", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      backgroundColor: ColorUtils.fromRgba(200, 1, 60)
    };

    const svg = ArcRenderer(arcProps);
    expect(svg.props.viewBox).toEqual("0 0 100 100");

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 98 50 A 48.5 48.5 0 0 1 50 98 L 48.5 48.5 L 98 50"
    );
    expect(pathArray[0].props.fill).toEqual("rgba(200,1,60,1)");
    expect(pathArray[0].props.stroke).toEqual("rgba(0,0,255,1)");
  });

  test("creating arc of angle > 180 degrees with fill (phoebus)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: 34,
      totalAngle: 201,
      transparent: false
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 90 77 A 48.5 48.5 0 1 1 22 10 L 48.5 48.5 L 90 77"
    );

    for (let i = 0; i < pathArray.length; i++) {
      if (i % 2) {
        // Even numbers are border elements
        expect(pathArray[i].props.stroke).toEqual("rgba(0,0,255,1)");
      } else {
        // Odd numbers are filled arc elements
        expect(pathArray[i].props.fill).toEqual("rgba(200,1,60,1)");
      }
    }
  });

  test("creating arc with negative start angle, with fill (css)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: -60,
      totalAngle: 40,
      fill: true,
      foregroundColor: ColorUtils.fromRgba(0, 100, 200),
      backgroundColor: ColorUtils.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 74 7 A 48.5 48.5 0 0 1 95 33 L 48.5 48.5 L 74 7"
    );
  });

  test("creating arc with negative start and total angle, no fill (phoebus)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: -100,
      totalAngle: -90,
      transparent: true,
      lineColor: ColorUtils.fromRgba(0, 101, 200),
      backgroundColor: ColorUtils.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Arc
    expect(pathArray[0].props.d).toEqual("M 41 2 A 48.5 48.5 0 0 0 2 58");
  });

  test("creating arc with negative total angle, no fill (css)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: 40,
      totalAngle: -120,
      fill: false,
      foregroundColor: ColorUtils.fromRgba(0, 100, 200),
      backgroundColor: ColorUtils.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Filled arc
    expect(pathArray[0].props.d).toEqual("M 87 81 A 48.5 48.5 0 0 0 58 2");
  });
});

describe("polarToCartesian()", (): void => {
  test("converting coordinates", (): void => {
    const coords = polarToCartesian(9, 9, 10, 10, 25);
    expect(coords).toEqual({ x: 18, y: 13 });
  });
});

describe("calculateArc()", (): void => {
  test("calculating full circle", (): void => {
    const [arc, edge] = calculateArc(100, 100, 0, 360, 2);
    expect(arc).toEqual("M 99 50 A 49 49 0 1 1 1 50 A 49 49 0 1 1 99 50");
    expect(edge).toEqual(" L 49 49 L 99 50");
  });

  test("calculating an arc with negative angle", (): void => {
    const [arc, edge] = calculateArc(100, 100, 30, -210, 2);
    expect(arc).toEqual("M 92 74 A 49 49 0 1 0 1 49");
    expect(edge).toEqual(" L 49 49 L 92 74");
  });
});
