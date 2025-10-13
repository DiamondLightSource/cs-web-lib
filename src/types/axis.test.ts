import { Color } from "./color";
import { Axis } from "./axis";
import { Font, FontStyle } from "./font";

describe("Axis", () => {
  it("constructs the x axis with values", (): void => {
    const testValues = {
      color: new Color("rgb(24, 76, 155"),
      title: "Testing",
      showGrid: true,
      logScale: true,
      autoscale: false,
      minimum: 100,
      maximum: 200,
      visible: false,
      scaleFont: new Font(20, FontStyle.Italic),
      titleFont: new Font(40),
      onRight: true,
      xAxis: true
    };
    const axis = new Axis(testValues);

    expect(axis).toEqual(testValues);
    expect(axis).toBeInstanceOf(Axis);
  });

  it("constructs the y axis with only defaults", (): void => {
    const axis = new Axis({ xAxis: false });

    expect(axis).toEqual({
      color: new Color("rgb(0, 0, 0"),
      title: "Y",
      showGrid: false,
      visible: true,
      logScale: false,
      autoscale: false,
      minimum: 0,
      maximum: 100,
      scaleFont: new Font(),
      titleFont: new Font(FontStyle.Bold),
      onRight: false,
      xAxis: false
    });
    expect(axis).toBeInstanceOf(Axis);
  });
});
