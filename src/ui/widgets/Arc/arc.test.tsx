import React from "react";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { ArcComponent } from "./arc";
import { ColorUtils } from "../../../types/color";
import { vi } from "vitest";
import { createMockStyle } from "../../../test-utils/styleTestUtils";
import { polarToCartesian } from "./arcUtils";

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
  test("create arc of angle < 180 degrees using default", (): void => {
    const arcProps = {
      height: 100,
      width: 100
    };

    const svg = ArcRenderer(arcProps);
    expect(svg.props.viewBox).toEqual("0 0 100 100");

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 100 50 A 50 50 0 0 1 50 100 L 50 50 L 100 50"
    );
    expect(pathArray[0].props.fill).toEqual("rgba(200,1,60,1)");
    expect(pathArray[0].props.stroke).toEqual("rgba(0,0,255,1)");
  });

  test("create arc of angle > 180 degrees with fill (phoebus)", (): void => {
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
      "M 91 77 A 50 50 0 1 1 21 9 L 50 50 L 91 77"
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

  test("create arc with negative start angle, with fill (css)", (): void => {
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
      "M 75 6 A 50 50 0 0 1 96 32 L 50 50 L 75 6"
    );
  });

  test("create arc with negative start and total angle, no fill (phoebus)", (): void => {
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
    expect(pathArray[0].props.d).toEqual("M 41 0 A 50 50 0 0 0 0 58");
  });

  test("create arc with negative total angle, no fill (css)", (): void => {
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
    expect(pathArray[0].props.d).toEqual("M 88 82 A 50 50 0 0 0 58 0");
  });
});

describe("polarToCartesian()", (): void => {
  test("calculate circumference point", (): void => {
    const coords = polarToCartesian(10, 10, 25);
    expect(coords).toEqual({ x: 19, y: 14 });
  });
});
