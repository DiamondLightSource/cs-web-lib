import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveAndNormaliseWidgetPaths } from "./parserPatcherUtils";
import * as urlUtils from "../../../misc/urlUtils";
import { normalisePath } from "../../../misc/urlUtils";

vi.mock("../../../misc/urlUtils", () => ({
  normalisePath: vi.fn(path => `resolved:${path}`),
  isFullyQualifiedUrl: vi.fn(
    path => typeof path === "string" && path.startsWith("http")
  )
}));

const isFullyQualifiedUrl =
  urlUtils.isFullyQualifiedUrl as unknown as ReturnType<typeof vi.fn>;

describe("resolveAndNormaliseWidgetPaths", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("mutates and returns the same object", () => {
    const widget: any = { type: "test" };

    const result = resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(result).toBe(widget);
  });

  it("resolves file.path if not fully qualified", () => {
    const widget: any = {
      file: { path: "file.opi" }
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", { A: "1" });

    expect(normalisePath).toHaveBeenCalledWith("file.opi", "/parent", {
      A: "1"
    });

    expect(widget.file.path).toBe("resolved:file.opi");
  });

  it("skips file.path if already fully qualified", () => {
    isFullyQualifiedUrl.mockReturnValue(true);

    const widget: any = {
      file: { path: "http://example.com/file.opi" }
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(normalisePath).not.toHaveBeenCalled();
  });

  it("resolves imageFile and image", () => {
    const widget: any = {
      imageFile: "img.png",
      image: "img2.png"
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.imageFile).toBe("resolved:img.png");
    expect(widget.image).toBe("resolved:img2.png");
  });

  it("skips image if fully qualified URL", () => {
    isFullyQualifiedUrl.mockImplementation(
      path => path && path?.startsWith("http")
    );

    const widget: any = {
      image: "http://example.com/img.png"
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(normalisePath).not.toHaveBeenCalled();
  });

  it("resolves action dynamicInfo file paths", () => {
    const widget: any = {
      actions: {
        actions: [
          {
            dynamicInfo: {
              file: { path: "action.opi" }
            }
          }
        ]
      }
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.actions.actions[0].dynamicInfo.file.path).toBe(
      "resolved:action.opi"
    );
  });

  it("resolves symbols paths", () => {
    const widget: any = {
      symbols: ["a.sym", "b.sym"]
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.symbols).toEqual(["resolved:a.sym", "resolved:b.sym"]);
  });

  it("skips fully qualified symbols", () => {
    isFullyQualifiedUrl.mockImplementation(
      path => path && path?.startsWith("http")
    );

    const widget: any = {
      symbols: ["http://example.com/a.sym"]
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.symbols[0]).toBe("http://example.com/a.sym");
  });

  it("resolves symbol paths inside rules expressions", () => {
    const widget: any = {
      symbols: ["a.sym"],
      rules: [
        {
          prop: "symbols[0]",
          expressions: [
            {
              convertedValue: "rule.sym"
            }
          ]
        }
      ]
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.rules[0].expressions[0].convertedValue).toBe(
      "resolved:rule.sym"
    );
  });

  it("resolves rule file paths", () => {
    const widget: any = {
      rules: [
        {
          prop: "file",
          expressions: [
            {
              convertedValue: {
                path: "rule.opi"
              }
            }
          ]
        }
      ]
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.rules[0].expressions[0].convertedValue.path).toBe(
      "resolved:rule.opi"
    );
  });

  it("resolves tab file paths", () => {
    const widget: any = {
      tabs: [{ file: "tab1.opi" }, { file: "tab2.opi" }]
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(widget.tabs[0].file).toBe("resolved:tab1.opi");
    expect(widget.tabs[1].file).toBe("resolved:tab2.opi");
  });

  it("skips tab file if fully qualified", () => {
    isFullyQualifiedUrl.mockReturnValue(true);

    const widget: any = {
      tabs: [{ file: "http://example.com/tab.opi" }]
    };

    resolveAndNormaliseWidgetPaths(widget, "/parent", {});

    expect(normalisePath).not.toHaveBeenCalled();
  });

  it("only skips sections that require parentDir when missing", () => {
    const widget: any = {
      file: { path: "file.opi" },
      image: "img.png"
    };

    resolveAndNormaliseWidgetPaths(widget, undefined, {});

    expect(normalisePath).toHaveBeenCalledWith("img.png", undefined, {});
  });
});
