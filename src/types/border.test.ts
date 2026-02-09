import { BorderStyle, borderToCss, newBorder } from "./border";
import { Color } from "./color";

describe("Border", () => {
  it("creates the correct style", (): void => {
    const border = newBorder(BorderStyle.Line, Color.RED, 1);
    expect(borderToCss(border)).toEqual({
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "rgba(255,0,0,1)"
    });
  });
  it("sets border radius if defined", (): void => {
    const border = newBorder(BorderStyle.Line, Color.RED, 1, 2);
    expect(borderToCss(border)).toEqual({
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "rgba(255,0,0,1)",
      borderRadius: "2px"
    });
  });
});
