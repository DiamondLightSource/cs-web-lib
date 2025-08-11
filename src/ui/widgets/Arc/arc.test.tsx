import React from "react";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import {
  ArcComponent,
  circumPointFromAngle,
  findFillOption,
  findLineColor
} from "./arc";
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
    expect(pathArray[0].props.fill).toEqual("rgba(200,1,60,1)");
    expect(pathArray[0].props.stroke).toEqual("rgba(200,1,60,1)");
    // BOrder
    expect(pathArray[1].props.d).toEqual(
      "M 100 50\nA 50 50 0 0 1 50 100\nL 50 50\nL 100 50"
    );
    expect(pathArray[1].props.fill).toEqual("transparent");
    expect(pathArray[1].props.stroke).toEqual("rgba(0,0,255,1)");
  });

  test("create arc of angle > 180 degrees with fill (phoebus)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: 34,
      totalAngle: 201,
      transparent: false,
      lineColor: Color.fromRgba(0, 100, 200),
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
        expect(pathArray[i].props.stroke).toEqual("rgba(0,100,200,1)");
      } else {
        // Odd numbers are filled arc elements
        expect(pathArray[i].props.fill).toEqual("rgba(45,1,180,1)");
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

  test("create arc with negative start and total angle, no fill (phoebus)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: -100,
      totalAngle: -90,
      transparent: true,
      lineColor: Color.fromRgba(0, 101, 200),
      backgroundColor: Color.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Border paths of arc
    expect(pathArray.length).toEqual(1);
    // Arc
    expect(pathArray[0].props.d).toEqual(
      "M 41 1\nA 50 50 -100 0 0 1 59\nL 50 50\nL 41 1"
    );
  });

  test("create arc with negative total angle, no fill (css)", (): void => {
    const arcProps = {
      height: 100,
      width: 100,
      startAngle: 40,
      totalAngle: -120,
      fill: false,
      foregroundColor: Color.fromRgba(0, 100, 200),
      backgroundColor: Color.fromRgba(45, 1, 180)
    };

    const svg = ArcRenderer(arcProps);

    const pathArray = svg.children as Array<ReactTestRendererJSON>;
    // Border paths of arc
    expect(pathArray.length).toEqual(2);
    // Filled arc
    expect(pathArray[0].props.d).toEqual("M 88 82\nA 50 50 40 0 0 82 12");
  });
});

describe("circumPointFromAngle()", (): void => {
  test("calculate circumference point", (): void => {
    const coords = circumPointFromAngle(0, 0, 20, 20, 45);
    expect(coords).toEqual([11, 17]);
  });
});

describe("findFillOption()", (): void => {
  test("Use Phoebus fill option", (): void => {
    const fillOpt = findFillOption(false, undefined);
    expect(fillOpt).toEqual(true);
  });
  test("Use CSStudio fill option", (): void => {
    const fillOpt = findFillOption(undefined, true);
    expect(fillOpt).toEqual(true);
  });
  test("Use default fill option", (): void => {
    const fillOpt = findFillOption(undefined, undefined);
    expect(fillOpt).toEqual(true);
  });
});

describe("findLineColor()", (): void => {
  test("Use Phoebus line color", (): void => {
    const lineColor = findLineColor(Color.fromRgba(20, 15, 100), undefined);
    expect(lineColor).toEqual(Color.fromRgba(20, 15, 100));
  });
  test("Use CSStudio foreground color", (): void => {
    const lineColor = findLineColor(undefined, Color.fromRgba(40, 250, 100));
    expect(lineColor).toEqual(Color.fromRgba(40, 250, 100));
  });
  test("Use default line color", (): void => {
    const lineColor = findLineColor(undefined, undefined);
    expect(lineColor).toEqual(Color.fromRgba(0, 0, 255, 1));
  });
});
