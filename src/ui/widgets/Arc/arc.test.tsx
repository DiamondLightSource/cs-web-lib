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
    // Fill and border paths of arc
    expect(pathArray.length).toEqual(2);
    // Filled arc
    expect(pathArray[0].props.d).toEqual(
      "M 50 50\nL 50 100\nA 50 50 0 0 1 0 50\nZ"
    );
    expect(pathArray[0].props.fill).toEqual("transparent");
    // Border path
    expect(pathArray[1].props.d).toEqual("M 50 100\nA 50 50 0 0 1 0 50");
    expect(pathArray[1].props.stroke).toEqual("rgba(0,1,255,255)");
    expect(pathArray[1].props.fill).toEqual("transparent");
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
      "M 50 50\nL 99 61\nA 50 50 0 0 1 39 99\nZ"
    );
    for (let i = 0; i < pathArray.length; i++) {
      if (i % 2) {
        // Even numbers are border elements
        expect(pathArray[i].props.stroke).toEqual("rgba(0,100,200,255)");
      } else {
        // Odd numbers are filled arc elements
        expect(pathArray[i].props.fill).toEqual("rgba(45,1,180,255)");
      }
    }
  });
});

describe("circumPointFromAngle()", (): void => {
  test("calculate circumference point", (): void => {
    const coords = circumPointFromAngle(0, 0, 20, 20, 45);
    expect(coords).toEqual([11, 17]);
  });
});
