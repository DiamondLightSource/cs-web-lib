import { Color } from "./color";
import { Trace } from "./trace";

describe("Trace", () => {
  it("constructs the trace with values", (): void => {
    const testValues = {
      name: "Testing",
      axis: 1,
      lineWidth: 5,
      lineStyle: 2,
      traceType: 1,
      color: Color.fromRgba(200, 10, 200),
      pointType: 2,
      pointSize: 10,
      visible: false,
      xPv: "TEST-01:PV",
      yPv: "TEST-02:PV"
    };
    const trace = new Trace(testValues);

    expect(trace).toEqual(testValues);
    expect(trace).toBeInstanceOf(Trace);
  });

  it("construct the trace with only defaults", (): void => {
    const trace = new Trace();
    expect(trace).toEqual({
      name: "",
      axis: 0,
      lineWidth: 0,
      lineStyle: 0,
      traceType: 0,
      color: Color.fromRgba(0, 0, 255),
      pointType: 0,
      pointSize: 1,
      visible: true,
      yPv: ""
    });
    expect(trace).toBeInstanceOf(Trace);
  });
});
