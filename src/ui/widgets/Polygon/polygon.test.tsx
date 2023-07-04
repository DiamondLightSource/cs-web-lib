import React from "react";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { PolygonComponent } from "./polygon";
import { Color } from "../../../types/color";

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
      lineStyle: 1,
      lineColor: Color.fromRgba(0, 1, 255),
      backgroundColor: Color.fromRgba(200, 1, 60),
      points: {
        values: [
          { x: 1, y: 10 },
          { x: 15, y: 20 }
        ]
      },
      rotationAngle: 0
    };

    const svg = PolygonRenderer(polygonProps);
    expect(svg.props.viewBox).toEqual("0 0 20 10");

    const polygon = svg.children![0] as ReactTestRendererJSON;
    expect(polygon.props.points).toEqual("1,10 15,20 ");
    expect(polygon.props.fill).toEqual("rgba(200,1,60,255)");
    expect(polygon.props.transform).toEqual("rotation(0,0,0)");
    expect(polygon.props.stroke).toEqual("rgba(0,1,255,255)");
    expect(polygon.props.strokeWidth).toEqual(2);
  });

  test("no points props, component doesn't render", (): void => {
    const polygonProps = {
      height: 10,
      width: 20,
      lineWidth: 2,
      lineStyle: 1,
      lineColor: Color.fromRgba(0, 1, 255),
      backgroundColor: Color.fromRgba(200, 1, 60),
      rotationAngle: 0
    };

    const svg = PolygonRenderer(polygonProps);
    expect(svg).toBeNull();
  });
});
