import React from "react";
import { DeviceComponent } from "./device";
import { render } from "@testing-library/react";
import * as deviceHook from "../../hooks/useDevice";
import * as jsonParsing from "../createComponent";
import { DType } from "../../../types/dtypes";
import { ensureWidgetsRegistered } from "..";
import { vi } from "vitest";
ensureWidgetsRegistered();

const useDeviceMock = vi
  .spyOn(deviceHook, "useDevice")
  .mockImplementation((device: string): DType | undefined => undefined);

const descriptionToComponentMock = vi
  .spyOn(jsonParsing, "widgetDescriptionToComponent")
  .mockImplementation(() => <p>{"Mocked"}</p>);

describe("<DeviceComponent />", (): void => {
  test("adds dev:// to deviceName", (): void => {
    render(<DeviceComponent deviceName={"fake Device"} />);
    expect(useDeviceMock).toHaveBeenCalledWith("dev://fakeDevice");
    expect(descriptionToComponentMock).toHaveBeenCalled();
  });
});
