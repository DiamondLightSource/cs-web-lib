import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScripts } from "./useScripts";
import { useSubscription } from "./useSubscription";
import { useSelector } from "react-redux";
import { executeDynamicScriptInSandbox } from "../widgets/EmbeddedDisplay/scripts/scriptExecutor";
import { PV } from "../../types/pv";
import { Script } from "../../types/props";

vi.mock("./useSubscription");
vi.mock("react-redux");
vi.mock("../widgets/EmbeddedDisplay/scripts/scriptExecutor");

describe("useScripts", () => {
  const mockCallback = vi.fn();
  const mockWidgetId = "test-widget-id";

  beforeEach(() => {
    vi.clearAllMocks();

    (useSelector as ReturnType<typeof vi.fn>).mockImplementation(selector => {
      return {
        "ca://pv1": [
          {
            value: {
              getDoubleValue: () => 10,
              getStringValue: () => "10",
              getArrayValue: () => [10],
              toString: () => "10"
            }
          }
        ],
        "ca://pv2": [
          {
            value: {
              getDoubleValue: () => null,
              getStringValue: () => null,
              getArrayValue: () => null,
              toString: () => "test"
            }
          }
        ],
        "ca://pv3": [{ value: null }]
      };
    });

    (
      executeDynamicScriptInSandbox as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      success: true,
      result: "test result"
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should subscribe to all PVs from scripts", () => {
    const scripts = [
      {
        text: "return pvs[0] + pvs[1]",
        pvs: [
          { pvName: new PV("pv1"), trigger: true },
          { pvName: new PV("pv2"), trigger: true }
        ]
      } as Partial<Script> as Script
    ];

    renderHook(() => useScripts(scripts, mockWidgetId, mockCallback));

    expect(useSubscription).toHaveBeenCalledWith(
      mockWidgetId,
      ["ca://pv1", "ca://pv2"],
      [
        { string: true, double: true },
        { string: true, double: true }
      ]
    );
  });

  it("should execute scripts with PV values", async () => {
    const scripts = [
      {
        text: "return pvs[0] + pvs[1]",
        pvs: [{ pvName: new PV("pv1") }, { pvName: new PV("pv2") }]
      } as Partial<Script> as Script
    ];

    renderHook(() => useScripts(scripts, mockWidgetId, mockCallback));

    vi.useFakeTimers();
    await vi.runAllTimersAsync();

    expect(executeDynamicScriptInSandbox).toHaveBeenCalledWith(
      "return pvs[0] + pvs[1]",
      [
        { number: 10, string: "10" },
        { number: null, string: null }
      ]
    );
    expect(mockCallback).toHaveBeenCalledWith({
      success: true,
      result: "test result"
    });
  });

  it("should handle undefined scripts prop", () => {
    // @ts-expect-error Testing undefined input
    // eslint-disable-next-line
    renderHook(() => useScripts(undefined, mockWidgetId, mockCallback));

    expect(useSubscription).toHaveBeenCalledWith(mockWidgetId, [], []);
    expect(executeDynamicScriptInSandbox).not.toHaveBeenCalled();
  });

  it("should handle PVs with null values", async () => {
    const scripts = [
      {
        text: "return pvs[0]",
        pvs: [{ pvName: new PV("pv3") }]
      } as Partial<Script> as Script
    ];

    renderHook(() => useScripts(scripts, mockWidgetId, mockCallback));

    vi.useFakeTimers();
    await vi.runAllTimersAsync();

    expect(executeDynamicScriptInSandbox).toHaveBeenCalledWith(
      "return pvs[0]",
      [{ number: undefined, string: undefined }]
    );
  });

  it("should handle multiple scripts", async () => {
    const scripts = [
      {
        text: "return pvs[0]",
        pvs: [{ pvName: new PV("pv1") }]
      } as Partial<Script> as Script,
      {
        text: "return pvs[0]",
        pvs: [{ pvName: new PV("pv2") }]
      } as Partial<Script> as Script
    ];

    renderHook(() => useScripts(scripts, mockWidgetId, mockCallback));

    vi.useFakeTimers();
    await vi.runAllTimersAsync();

    expect(executeDynamicScriptInSandbox).toHaveBeenCalledTimes(2);
    expect(executeDynamicScriptInSandbox).toHaveBeenNthCalledWith(
      1,
      "return pvs[0]",
      [{ number: 10, string: "10" }]
    );
    expect(executeDynamicScriptInSandbox).toHaveBeenNthCalledWith(
      2,
      "return pvs[0]",
      [{ number: null, string: null }]
    );
  });
});
