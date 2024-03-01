import React from "react";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { ArcComponent, circumPointFromAngle } from "./arc";
import { Color } from "../../../types/color";

const ArcRenderer = (arcProps: any): ReactTestRendererJSON => {
  return renderer
    .create(<ArcComponent {...arcProps} />)
    .toJSON() as ReactTestRendererJSON;
};

describe("<ArcComponent />", (): void => {
  test("create arc of angle < 180 degrees using default", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      foregroundColor: Color.fromRgba(0, 1, 255),
      backgroundColor: Color.fromRgba(200, 1, 60)
    };

    const svg = ArcRenderer(arcProps);
    expect(svg.props.viewBox).toEqual("0 0 100 100");

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Default fills, expect border path and fill of arc
    expect(pathArray.length).toEqual(2);
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 50 50\nL 100 50\nA 50 50 0 0 1 50 100\nZ"
    );
    expect(pathArray[0].props.fill).toEqual("rgba(200,1,60,255)");
    expect(pathArray[0].props.stroke).toEqual("rgba(200,1,60,255)");
    // BOrder
    expect(pathArray[1].props.d).toEqual("M 100 50\nA 50 50 0 0 1 50 100");
    expect(pathArray[1].props.fill).toEqual("transparent");
    expect(pathArray[1].props.stroke).toEqual("rgba(0,0,255,255)");
  });

  test("create arc of angle > 180 degrees", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: 34,
      totalAngle: 201,
      fill: true,
      foregroundColor: Color.fromRgba(0, 100, 200),
      backgroundColor: Color.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Fill and border paths of arc
    expect(pathArray.length).toEqual(6);
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 50 50\nL 91 78\nA 50 50 34 0 1 22 91\nZ"
    );

    for (let i = 0; i < pathArray.length; i++) {
      if (i % 2) {
        // Even numbers are border elements
        expect(pathArray[i].props.stroke).toEqual("rgba(0,0,255,255)");
      } else {
        // Odd numbers are filled arc elements
        expect(pathArray[i].props.fill).toEqual("rgba(45,1,180,255)");
      }
    }
  });

  test("create arc with negative start angle", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: -60,
      totalAngle: 40,
      fill: true,
      foregroundColor: Color.fromRgba(0, 100, 200),
      backgroundColor: Color.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Fill and border paths of arc
    expect(pathArray.length).toEqual(2);
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 50 50\nL 75 7\nA 50 50 -60 0 1 97 33\nZ"
    );
  });

  test("create arc with negative start and total angle", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: -100,
      totalAngle: -90,
      fill: true,
      foregroundColor: Color.fromRgba(0, 100, 200),
      backgroundColor: Color.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Fill and border paths of arc
    expect(pathArray.length).toEqual(2);
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 50 50\nL 41 1\nA 50 50 -100 0 0 1 59\nZ"
    );
  });

  test("create arc with negative total angle", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: 40,
      totalAngle: -120,
      fill: true,
      foregroundColor: Color.fromRgba(0, 100, 200),
      backgroundColor: Color.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Fill and border paths of arc
    expect(pathArray.length).toEqual(4);
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 50 50\nL 88 82\nA 50 50 40 0 0 82 12\nZ"
    );
  });
});

describe("circumPointFromAngle()", (): void => {
  test("calculate circumference point", (): void => {
    const coords = circumPointFromAngle(0, 0, 20, 20, 45);
    expect(coords).toEqual([11, 17]);
  });
});
