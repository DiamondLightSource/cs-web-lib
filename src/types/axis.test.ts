import { newColor } from "./color";
import { Axis } from "./axis";
import { FontStyle, newFont } from "./font";

describe("Axis", () => {
  it("constructs the x axis with values", (): void => {
    const testValues = {
      color: newColor("rgb(24, 76, 155"),
      title: "Testing",
      showGrid: true,
      logScale: true,
      autoscale: false,
      minimum: 100,
      maximum: 200,
      visible: false,
      scaleFont: newFont(20, FontStyle.Italic),
      titleFont: newFont(40),
      onRight: true,
      xAxis: true
    };
    const axis = new Axis(testValues);

    expect({ ...axis, color: axis.color.colorString }).toEqual({
      ...testValues,
      color: testValues.color.colorString
    });
    expect(axis).toBeInstanceOf(Axis);
  });

  it("constructs the y axis with only defaults", (): void => {
    const axis = new Axis({ xAxis: false });

    expect({ ...axis, color: axis.color.colorString }).toEqual({
      color: newColor("rgb(0, 0, 0)").colorString,
      title: "Y",
      showGrid: false,
      visible: true,
      logScale: false,
      autoscale: false,
      minimum: 0,
      maximum: 100,
      scaleFont: newFont(12),
      titleFont: newFont(14, FontStyle.Bold),
      onRight: false,
      xAxis: false
    });
    expect(axis).toBeInstanceOf(Axis);
  });
});
