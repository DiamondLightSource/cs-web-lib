import { colorChangeAlpha, newColor } from "./color";

describe("Color", (): void => {
  it.each<[string]>([["green"], ["red"]])(
    "accepts string as color",
    (name): void => {
      expect(newColor(name).colorString).toEqual(name);
    }
  );

  describe("changeAlpha", (): void => {
    it("Changes alpha on rgba color string", () => {
      const initialColor = newColor("rgba(150,140,130,1)");
      const fadedColor = colorChangeAlpha(initialColor, 0.5);
      expect(fadedColor.colorString).toBe("rgba(150, 140, 130, 0.5)");
    });

    it("Changes alpha on hex color string", () => {
      const initialColor = newColor("#CC3333"); // equivalent to 'rgba(204,51,51,1)'
      const fadedColor = colorChangeAlpha(initialColor, 0.2);
      expect(fadedColor.colorString).toBe("rgba(204, 51, 51, 0.2)");
    });

    it("Changes alpha on rgb color string", () => {
      const initialColor = newColor("rgb(51,102,204)");
      const fadedColor = colorChangeAlpha(initialColor, 0.7);
      expect(fadedColor.colorString).toBe("rgba(51, 102, 204, 0.7)");
    });

    it("Changes alpha on hsl color string", () => {
      const initialColor = newColor("hsl(210, 50%, 50%)");
      const fadedColor = colorChangeAlpha(initialColor, 0.3);
      expect(fadedColor.colorString).toBe("rgba(64, 128, 191, 0.3)");
    });
  });
});
