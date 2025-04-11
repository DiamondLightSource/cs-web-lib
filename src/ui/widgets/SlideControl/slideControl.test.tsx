import React from "react";
import { render, screen } from "@testing-library/react";
import { ddouble } from "../../../testResources";
import { SlideControlComponent } from "./slideControl";
import { PV } from "../../../types";

const pv = new PV("loc://test", "ca");

test("slideControl", () => {
  const { container } = render(
    <SlideControlComponent
      value={ddouble(5)}
      connected={true}
      readonly={false}
      pvName={pv}
      max={10}
      min={0}
    ></SlideControlComponent>
  );

  // The label on the progress bar.
  expect(screen.getByText("5")).toBeInTheDocument();
  // The slider element.
  const slider = container.querySelector("input");
  expect(slider?.value).toEqual("5");
  expect(slider?.min).toEqual("0");
  expect(slider?.max).toEqual("10");
});
