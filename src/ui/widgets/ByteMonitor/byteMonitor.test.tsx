import React from "react";
import {
  ByteMonitorComponent,
  recalculateDimensions,
  getBytes
} from "./byteMonitor";
import { Color } from "../../../types";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { DType } from "../../../types/dtypes";

const ByteMonitorRenderer = (byteMonitorProps: any): ReactTestRendererJSON => {
  return renderer
    .create(<ByteMonitorComponent {...byteMonitorProps} />)
    .toJSON() as ReactTestRendererJSON;
};

describe("<ByteMonitorComponent />", (): void => {
  test("default properties are added to bytemonitor component", (): void => {
    const byteMonitorProps = {
      value: new DType({ doubleValue: 15 }),
      height: 40,
      width: 40
    };

    const byteMonitor = ByteMonitorRenderer(byteMonitorProps);
    const bits = byteMonitor.children as Array<ReactTestRendererJSON>;
    expect(bits.length).toEqual(16);

    expect(bits[0].props.style.marginRight).toEqual("-1px");
    expect(bits[1].props.style.borderWidth).toEqual(0);
    expect(bits[5].props.style.backgroundColor).toEqual("rgba(0,100,0,255)");
    expect(bits[10].props.style.boxShadow).toEqual(
      "inset 0.359375px 0.359375px 0.5750000000000001px rgba(255,255,255,.5), 1px 1px white, -1px -1px darkgray"
    );
    expect(bits[15].props.style.borderRadius).toEqual("50%");
  });
  test("overwrite bytemonitor defautl values", (): void => {
    const byteMonitorProps = {
      value: new DType({ doubleValue: 2 }),
      height: 50,
      width: 50,
      startBit: 8,
      numBits: 16,
      horizontal: false,
      squareLed: true,
      bitReverse: true,
      effect3d: false,
      onColor: Color.fromRgba(200, 200, 200),
      offColor: Color.fromRgba(100, 100, 100),
      ledBorder: 1,
      ledBorderColor: Color.fromRgba(150, 150, 150)
    };

    const byteMonitor = ByteMonitorRenderer(byteMonitorProps);
    const bits = byteMonitor.children as Array<ReactTestRendererJSON>;
    expect(bits.length).toEqual(16);

    expect(bits[0].props.style.marginBottom).toEqual("-1px");
    expect(bits[1].props.style.borderWidth).toEqual("1px");
    expect(bits[15].props.style.backgroundColor).toEqual(
      "rgba(100,100,100,255)"
    );
    expect(bits[10].props.style.boxShadow).toBeUndefined();
    expect(bits[15].props.style.borderRadius).toBeUndefined();
    expect(bits[1].props.style.marginRight).toBeUndefined();
  });
});

describe("ByteMonitor functions", (): void => {
  test("recalculateDimensions()", (): void => {
    const [dx, dy, border] = recalculateDimensions(4, 40, 40, 2, true, false);
    expect(dx).toEqual(8);
    expect(dy).toEqual(38);
    expect(border).toEqual(2);
  });

  test("getBytes() with no bit reverse", (): void => {
    const bytes = getBytes(5, 16, 0, false);
    expect(bytes.length).toEqual(16);
    expect(bytes).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1]);
  });
  test("getBytes() with reversed bits", (): void => {
    const bytes = getBytes(5, 16, 0, true);
    expect(bytes.length).toEqual(16);
    expect(bytes).toEqual([1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});
