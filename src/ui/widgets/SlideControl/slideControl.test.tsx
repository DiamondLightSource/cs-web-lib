import React from "react";
import { render, screen } from "@testing-library/react";
import { ddouble } from "../../../testResources";
import { SlideControlComponent } from "./slideControl";
import { createMockStyle } from "../../../test-utils/styleTestUtils";
import { vi } from "vitest";

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() => createMockStyle())
}));

vi.mock("../../hooks/useMeasuredSize", () => ({
  useMeasuredSize: (width: number, height: number) => [
    { current: null },
    { width, height }
  ]
}));

test("slideControl", () => {
  const { container } = render(
    <SlideControlComponent
      pvData={[
        {
          value: ddouble(5),
          connected: true,
          readonly: false,
          effectivePvName: "pv"
        }
      ]}
      maximum={10}
      minimum={0}
    ></SlideControlComponent>
  );

  // The label on the progress bar.
  expect(screen.getByText("4")).toBeInTheDocument();
  // The slider element.
  const slider = container.querySelector("input");
  expect(slider?.value).toEqual("5");
  expect(slider?.min).toEqual("0");
  expect(slider?.max).toEqual("10");
});

test("slideControl is disabled when readonly is set to true", () => {
  const { container } = render(
    <SlideControlComponent
      pvData={[
        {
          value: ddouble(5),
          connected: true,
          readonly: true,
          effectivePvName: "pv"
        }
      ]}
      maximum={10}
      minimum={0}
    ></SlideControlComponent>
  );

  // The slider element.
  const slider = container.querySelector("input");
  expect(slider?.disabled).toBeTruthy();
});
