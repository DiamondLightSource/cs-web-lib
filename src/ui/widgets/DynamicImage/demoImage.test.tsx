import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  DemoImageComponent,
  overridePvSubscriptionsWithMjpgUrl
} from "./demoImage";
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
  it("renders an img with the expected src and alt text", () => {
    const data = [
      {
        value: newDType(
          { stringValue: "/images/demoCameraImage.jpg" },
          DAlarmNONE()
        ),
        effectivePvName: "demoImage"
      } as PvDatum
    ];

    render(
      <DemoImageComponent
        macros={{}}
        pvData={data}
        backgroundColor={newColor("#123456")}
      />
    );

    const img = screen.getByRole("img", { name: /PvName: TEST:PV/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/demoCameraImage.jpg");
    expect(img).toHaveAttribute("alt", "PvName: TEST:PV");
  });

  it("handles undefined backgroundColor gracefully (no style set)", () => {
    render((<DemoImageComponent pvData={[]} macros={{}} />) as any);

    const img = screen.getByRole("img", { name: /PvName: TEST:PV/i });
    expect((img as HTMLElement).getAttribute("style") || "").not.toMatch(
      /background-color/i
    );
  });

  it("falls back to next src on error", () => {
    const data = [
      { value: newDType({ stringValue: "bad-url-1" }) },
      { value: newDType({ stringValue: "good-url-2" }) }
    ];

    render(<DemoImageComponent pvData={data as any} macros={{}} />);

    const img = screen.getByRole("img");

    // initial src
    expect(img).toHaveAttribute("src", "bad-url-1");

    // trigger error → should fallback
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", "good-url-2");
  });

  it("calls showWarning when all sources fail", () => {
    const data = [
      { value: { stringValue: "bad-url-1" } },
      { value: { stringValue: "bad-url-2" } }
    ];

    render(<DemoImageComponent pvData={data as any} macros={{}} />);

    const img = screen.getByRole("img");

    // first failure → fallback
    fireEvent.error(img);

    // second failure → warning
    fireEvent.error(img);

    expect(showWarningMock).toHaveBeenCalledWith(
      "Could not load mjpg image stream for the PV: TEST:PV"
    );
  });
});

describe("overridePvSubscriptionsWithMjpgUrl", () => {
  it("returns empty subscriptions and no additional data when no inputs provided", () => {
    const fn = overridePvSubscriptionsWithMjpgUrl(undefined);

    const result = fn([]);

    expect(result.pvNameSubscriptions).toEqual([]);
    expect(result.additionalPvData).toEqual({});
  });

  it("returns empty additionalPvData when pvNameArray is empty", () => {
    const fn = overridePvSubscriptionsWithMjpgUrl(["http://camera"]);

    const result = fn([]);

    expect(result.pvNameSubscriptions).toEqual([]);
    expect(result.additionalPvData).toEqual({});
  });

  it("creates pv entries for each valid endpoint", () => {
    const endpoints = ["http://cam1", "http://cam2"];
    const fn = overridePvSubscriptionsWithMjpgUrl(endpoints);

    const result = fn(["TEST:ARRAY"]);

    expect(result.pvNameSubscriptions).toEqual([]);

    const keys = Object.keys(result.additionalPvData);
    expect(keys).toHaveLength(2);

    expect(keys).toContain("TEST:OUTPUT_0");
    expect(keys).toContain("TEST:OUTPUT_1");

    const entry = result.additionalPvData["TEST:OUTPUT_0"];
    expect(entry[0].value?.value.stringValue).toBe("http://cam1/TEST:OUTPUT");
    expect(entry[0].value?.alarm).toEqual(DAlarmNONE());
  });

  it("removes pva:// prefix and replaces :ARRAY with :OUTPUT", () => {
    const fn = overridePvSubscriptionsWithMjpgUrl(["http://cam"]);

    const result = fn(["pva://MY:PV:ARRAY"]);

    const entry = result.additionalPvData["MY:PV:OUTPUT_0"];

    expect(entry[0].value?.value.stringValue).toBe("http://cam/MY:PV:OUTPUT");
  });

  it("filters out null and undefined endpoints", () => {
    const fn = overridePvSubscriptionsWithMjpgUrl([
      "http://cam1",
      null,
      undefined,
      "http://cam2"
    ]);

    const result = fn(["TEST:ARRAY"]);

    const keys = Object.keys(result.additionalPvData);
    expect(keys).toHaveLength(2);

    expect(
      result?.additionalPvData?.["TEST:OUTPUT_0"]?.[0]?.value?.value.stringValue
    ).toBe("http://cam1/TEST:OUTPUT");

    expect(
      result.additionalPvData["TEST:OUTPUT_1"][0].value?.value.stringValue
    ).toBe("http://cam2/TEST:OUTPUT");
  });

  it("returns empty additionalPvData if all endpoints are null/undefined", () => {
    const fn = overridePvSubscriptionsWithMjpgUrl([null, undefined]);

    const result = fn(["TEST:ARRAY"]);

    expect(result.additionalPvData).toEqual({});
    expect(result.pvNameSubscriptions).toEqual([]);
  });
});
