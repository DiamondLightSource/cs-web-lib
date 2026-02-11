import { FontStyle, fontToCss, newFont } from "./font";

describe("Font", (): void => {
  it("returns the correct style for a simple font", (): void => {
    const font = newFont(10, FontStyle.Regular, "sans");
    const fontStyle = fontToCss(font);
    expect(fontStyle).toEqual({
      fontFamily: "sans,sans-serif",
      fontSize: "0.625rem",
      fontWeight: "normal",
      fontStyle: "normal"
    });
  });
  it("returns the correct style for a bold italic font", (): void => {
    const font = newFont(16, FontStyle.BoldItalic);
    const fontStyle = fontToCss(font);
    expect(fontStyle).toEqual({
      fontFamily: "Liberation sans,sans-serif",
      fontSize: "1rem",
      fontWeight: "bold",
      fontStyle: "italic"
    });
  });

  it("fontStyle is left out of CSSProperties when not input", (): void => {
    const font = newFont();
    expect(font).not.toHaveProperty("fontStyle");
  });
});
