import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DemoImageComponent, buildMjpgPvUrls } from "./demoImage";
import { newColor } from "../../../types/color";
import { vi } from "vitest";
import { createMockStyle } from "../../../test-utils/styleTestUtils";
import { PvDatum } from "../../../redux/csState";
import { DAlarmNONE, newDType } from "../../../types/dtypes";

vi.mock("../../hooks/useStyle", () => ({
  useStyle: vi.fn(() => createMockStyle())
}));

const showWarningMock = vi.fn();

vi.mock("../../hooks", () => ({
  useNotification: () => ({
    showWarning: showWarningMock
  })
}));

vi.mock("../utils", () => ({
  getPvValueAndName: (pvData: any[], index = 0) => ({
    value: pvData[index]?.value,
    effectivePvName: "TEST:PV"
  })
}));

describe("DemoImageComponent", () => {
  beforeEach(() => {
    showWarningMock.mockClear();
  });

  it("renders an img with the expected src and alt text", () => {
    const data = [
      {
        value: newDType({ stringValue: "An ignored value" }, DAlarmNONE())
      } as PvDatum
    ];

    render(
      <DemoImageComponent
        macros={{}}
        pvData={data}
        mjpgEndpoints={["http://www.images.diamond.ac.uk/abc"]}
        backgroundColor={newColor("#123456")}
      />
    );

    const img = screen.getByRole("img", {
      name: /PvName: TEST:PV/i
    });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "http://www.images.diamond.ac.uk/abc/TEST:PV"
    );
    expect(img).toHaveAttribute("alt", "PvName: TEST:PV");
  });

  it("handles undefined backgroundColor gracefully (no style set)", () => {
    render((<DemoImageComponent pvData={[]} macros={{}} />) as any);

    const img = screen.getByRole("img", { name: /PvName: TEST:PV/i });
    expect((img as HTMLElement).getAttribute("style") || "").not.toMatch(
      /background-color/i
    );
  });

  it("cycles through URLs sequentially on repeated errors", () => {
    const data = [
      { value: newDType({ stringValue: "ignored" }, DAlarmNONE()) } as PvDatum
    ];

    render(
      <DemoImageComponent
        macros={{}}
        pvData={data}
        mjpgEndpoints={["http://a", "http://b", "http://c"]}
      />
    );

    const img = screen.getByRole("img");

    expect(img).toHaveAttribute("src", "http://a/TEST:PV");

    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "http://b/TEST:PV");

    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "http://c/TEST:PV");
  });

  it("shows warning when all URLs fail", () => {
    const data = [
      { value: newDType({ stringValue: "ignored" }, DAlarmNONE()) } as PvDatum
    ];

    render(
      <DemoImageComponent
        macros={{}}
        pvData={data}
        mjpgEndpoints={["http://a", "http://b"]}
      />
    );

    const img = screen.getByRole("img");

    fireEvent.error(img); // move to second URL
    fireEvent.error(img); // no more URLs → warning

    expect(showWarningMock).toHaveBeenCalledWith(
      "Could not load mjpg image stream for the PV: TEST:PV"
    );
  });

  it("resets failure counter after exhausting URLs", () => {
    const data = [
      { value: newDType({ stringValue: "ignored" }, DAlarmNONE()) } as PvDatum
    ];

    render(
      <DemoImageComponent
        macros={{}}
        pvData={data}
        mjpgEndpoints={["http://a", "http://b"]}
      />
    );

    const img = screen.getByRole("img");

    fireEvent.error(img); // → b
    fireEvent.error(img); // → warning + reset

    // Trigger again → should start sequence again from second URL
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", "http://b/TEST:PV");
  });

  it("handles missing endpoints without crashing", () => {
    render(<DemoImageComponent macros={{}} pvData={[]} mjpgEndpoints={[]} />);

    const img = screen.getByRole("img");
    fireEvent.error(img);

    expect(showWarningMock).toHaveBeenCalledWith(
      "Could not load mjpg image stream for the PV: TEST:PV"
    );
  });
});

describe("buildMjpgPvUrls", () => {
  it("returns empty array if pvName is missing", () => {
    const result = buildMjpgPvUrls(["http://test"], "");
    expect(result).toEqual([]);
  });

  it("returns empty array if endpoints are undefined", () => {
    const result = buildMjpgPvUrls(undefined, "TEST:PV");
    expect(result).toEqual([]);
  });

  it("returns empty array if endpoints are empty", () => {
    const result = buildMjpgPvUrls([], "TEST:PV");
    expect(result).toEqual([]);
  });

  it("filters out null/undefined endpoints", () => {
    const result = buildMjpgPvUrls(
      ["http://a", null, undefined, "http://b"],
      "TEST:PV"
    );

    expect(result).toEqual(["http://a/TEST:PV", "http://b/TEST:PV"]);
  });

  it("removes pva:// prefix from pvName", () => {
    const result = buildMjpgPvUrls(["http://a"], "pva://TEST:PV");

    expect(result).toEqual(["http://a/TEST:PV"]);
  });

  it("replaces :ARRAY suffix with :OUTPUT", () => {
    const result = buildMjpgPvUrls(["http://a"], "TEST:PV:ARRAY");

    expect(result).toEqual(["http://a/TEST:PV:OUTPUT"]);
  });

  it("handles both prefix removal and suffix replacement together", () => {
    const result = buildMjpgPvUrls(["http://a"], "pva://TEST:PV:ARRAY");

    expect(result).toEqual(["http://a/TEST:PV:OUTPUT"]);
  });

  it("builds urls for multiple endpoints", () => {
    const result = buildMjpgPvUrls(["http://a", "http://b"], "TEST:PV");

    expect(result).toEqual(["http://a/TEST:PV", "http://b/TEST:PV"]);
  });
});
