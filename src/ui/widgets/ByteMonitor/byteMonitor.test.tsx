import React from "react";
import {
  ByteMonitorComponent,
  recalculateDimensions,
  getBytes
} from "./byteMonitor";
import { Color } from "../../../types";
import renderer, { ReactTestRendererJSON } from "react-test-renderer";
import { newDType } from "../../../types/dtypes/dType";
import { PvDatum } from "../../../redux/csState";

const ByteMonitorRenderer = (byteMonitorProps: any): ReactTestRendererJSON => {
  return renderer
    .create(<ByteMonitorComponent {...byteMonitorProps} />)
    .toJSON() as ReactTestRendererJSON;
};

describe("<ByteMonitorComponent />", (): void => {
  test("default properties are added to bytemonitor component", (): void => {
    const byteMonitorProps = {
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 15 })
        } as Partial<PvDatum> as PvDatum
      ],
      height: 40,
      width: 40
    };

    const byteMonitor = ByteMonitorRenderer(byteMonitorProps);
    const bits = byteMonitor.children as Array<ReactTestRendererJSON>;
    expect(bits.length).toEqual(8);

    expect(bits[0].props.style.marginRight).toEqual("-2px");
    expect(bits[1].props.style.borderWidth).toEqual("2px");
    expect(bits[5].props.style.backgroundColor).toEqual("rgba(0,255,0,1)");
    expect(bits[7].props.style.borderRadius).toEqual("50%");
  });
  test("overwrite bytemonitor default values", (): void => {
    const byteMonitorProps = {
      pvData: [
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: newDType({ doubleValue: 2 })
        } as Partial<PvDatum> as PvDatum
      ],
      height: 50,
      width: 50,
      startBit: 8,
      numBits: 16,
      horizontal: false,
      square: true,
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
    expect(bits[15].props.style.backgroundColor).toEqual("rgba(100,100,100,1)");
    expect(bits[10].props.style.boxShadow).toBeUndefined();
    expect(bits[15].props.style.borderRadius).toBeUndefined();
    expect(bits[1].props.style.marginRight).toBeUndefined();
  });
});

describe("ByteMonitor functions", (): void => {
  test("recalculateDimensions() for bits", (): void => {
    const [dx, dy, border] = recalculateDimensions(4, 40, 40, 2, true, false);
    expect(dx).toEqual(9.5);
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
