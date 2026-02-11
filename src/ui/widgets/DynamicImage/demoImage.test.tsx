import React from "react";
import { render, screen } from "@testing-library/react";
import { DemoImageComponent } from "./demoImage";
import { ColorUtils, newColor } from "../../../types/color";

describe("DemoImageComponent", () => {
  it("renders an img with the expected src and alt text", () => {
    render(
      <DemoImageComponent macros={{}} backgroundColor={newColor("#123456")} />
    );

    const img = screen.getByRole("img", { name: /Static demo image/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/demoCameraImage.jpg");
    expect(img).toHaveAttribute("alt", "Static demo image");
  });

  it("applies backgroundColor style via sx from props", () => {
    render(
      <DemoImageComponent
        macros={{}}
        backgroundColor={ColorUtils.fromRgba(12, 24, 48)}
      />
    );

    const img = screen.getByRole("img", { name: /Static demo image/i });
    expect(img).toHaveStyle({ backgroundColor: "rgba(12,24,48,1)" });
  });

  it("handles undefined backgroundColor gracefully (no style set)", () => {
    render((<DemoImageComponent macros={{}} />) as any);

    const img = screen.getByRole("img", { name: /Static demo image/i });
    expect((img as HTMLElement).getAttribute("style") || "").not.toMatch(
      /background-color/i
    );
  });
});
