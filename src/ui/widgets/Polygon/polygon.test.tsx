import React from "react";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { PolygonComponent } from "./polygon";
import { ColorUtils } from "../../../types/color";

const PolygonRenderer = (polygonProps: any): ReactTestRendererJSON => {
  return renderer
    .create(<PolygonComponent {...polygonProps} />)
    .toJSON() as ReactTestRendererJSON;
};

describe("<PolygonComponent />", (): void => {
  test("default properties are added to line component", (): void => {
    const polygonProps = {
      height: 10,
      width: 20,
      lineWidth: 2,
      lineColor: ColorUtils.fromRgba(0, 1, 255),
      backgroundColor: ColorUtils.fromRgba(200, 1, 60),
      points: {
        values: [
          { x: 1, y: 10 },
          { x: 15, y: 20 }
        ]
      },
      rotationAngle: 0
    };

    const svg = PolygonRenderer(polygonProps);
    expect(svg.props.viewBox).toEqual("0 0 100% 100%");

    const polygons = svg.children as Array<ReactTestRendererJSON>;

    expect(polygons[0].props.points).toEqual("1,10 15,20 ");
    expect(polygons[0].props.fill).toEqual("rgba(200,1,60,1)");
    expect(polygons[0].props.transform).toEqual("rotation(0,0,0)");
    expect(polygons[0].props.stroke).toEqual("rgba(0,1,255,1)");
    expect(polygons[0].props.strokeWidth).toEqual(2);
  });

  test("make polygon transparent", (): void => {
    const polygonProps = {
      height: 10,
      width: 20,
      lineWidth: 2,
      lineColor: ColorUtils.fromRgba(0, 1, 255),
      backgroundColor: ColorUtils.fromRgba(200, 1, 60),
      points: {
        values: [
          { x: 1, y: 10 },
          { x: 10, y: 20 },
          { x: 7, y: 15 }
        ]
      },
      rotationAngle: 0,
      transparent: true
    };

    const svg = PolygonRenderer(polygonProps);

    const polygons = svg.children as Array<ReactTestRendererJSON>;

    expect(polygons[0].props.fill).toEqual("transparent");
    expect(polygons[0].props.stroke).toEqual("rgba(0,1,255,1)");
  });

  test("no points props, component renders without points", (): void => {
    const polygonProps = {
      height: 10,
      width: 20,
      lineWidth: 2,
      lineColor: ColorUtils.fromRgba(0, 1, 255),
      backgroundColor: ColorUtils.fromRgba(200, 1, 60),
      rotationAngle: 0
    };

    const svg = PolygonRenderer(polygonProps);
    const polygons = svg.children as Array<ReactTestRendererJSON>;
    expect(polygons.length).toEqual(1);
    expect(polygons[0].props.points).toEqual("");
  });
});
