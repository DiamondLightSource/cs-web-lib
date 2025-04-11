import React from "react";
import { SmartInputComponent } from "./input";
import { render } from "@testing-library/react";
import { DAlarm } from "../../../types/dtypes";
import { dstring } from "../../../testResources";
import { PV, RelativePosition } from "../../../types";

let input: JSX.Element;
const pv = new PV("loc://test", "ca");
beforeEach((): void => {
  input = (
    <SmartInputComponent
      pvName={pv}
      position={new RelativePosition()}
      value={dstring("hello", DAlarm.MINOR)}
      connected={true}
      readonly={true}
      alarmSensitive={true}
    />
  );
});
describe("<Input />", (): void => {
  it("renders an input", (): void => {
    const { asFragment } = render(input);
    expect(asFragment()).toMatchSnapshot();
  });
});
