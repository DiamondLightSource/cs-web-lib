import React from "react";
import { SmartInputComponent } from "./input";
import { render } from "@testing-library/react";
import { DAlarm } from "../../../types/dtypes";
import { dstring } from "../../../testResources";
import { PvDatum } from "../../../redux/csState";

let input: JSX.Element;
beforeEach((): void => {
  input = (
    <SmartInputComponent
      pvData={[
        {
          effectivePvName: "TEST:PV",
          connected: true,
          readonly: true,
          value: dstring("hello", DAlarm.MINOR)
        } as Partial<PvDatum> as PvDatum
      ]}
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
