import React from "react";
import { render, screen } from "@testing-library/react";
import { DemoImageComponent } from "./demoImage";
import { newColor } from "../../../types/color";
import { vi } from "vitest";
import { createMockStyle } from "../../../test-utils/styleTestUtils";

vi.mock("../../themeUtils", () => ({
  useStyle: vi.fn(() => createMockStyle())
}));

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

  it("handles undefined backgroundColor gracefully (no style set)", () => {
    render((<DemoImageComponent macros={{}} />) as any);

    const img = screen.getByRole("img", { name: /Static demo image/i });
    expect((img as HTMLElement).getAttribute("style") || "").not.toMatch(
      /background-color/i
    );
  });
});
