import { ColorUtils, newColor } from "./color";
import { newRoi } from "./rois";

describe("Roi", () => {
  it("constructs the region of interest with values", (): void => {
    const testValues = {
      name: "Testing",
      color: newColor("rgb(24, 76, 155"),
      visible: false,
      interactive: false,
      xPv: "TEST-X:01",
      yPv: "TEST-Y:02",
      heightPv: "TEST-W:03",
      widthPv: "TEST-H:04"
    };
    const roi = newRoi(testValues);

    expect(roi).toEqual(testValues);
  });

  it("constructs the region of interest with only defaults", (): void => {
    const roi = newRoi({});

    expect(roi).toEqual({
      name: "",
      color: ColorUtils.RED,
      visible: true,
      interactive: true
    });
  });
});
