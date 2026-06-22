import { describe, it, expect, vi } from "vitest";
import { resolveWidgetPathsAndMacros } from "./fileCacheSliceUtils";
import { resolveAndNormaliseWidgetPaths } from "../../ui/widgets/EmbeddedDisplay/parserPatcherUtils";
import { WidgetDescription } from "../../ui/widgets/createComponent";

vi.mock("../../ui/widgets/EmbeddedDisplay/parserPatcherUtils", () => ({
  resolveAndNormaliseWidgetPaths: vi.fn((widget, filepath, macros) => {
    widget._resolved = {
      filepath,
      macros
    };

    return widget;
  })
}));

describe("resolveWidgetPathsAndMacros", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("applies resolveAndNormaliseWidgetPaths to root", () => {
    const widget = { type: "root" } as Partial<WidgetDescription>;

    const result = resolveWidgetPathsAndMacros(
      widget as WidgetDescription,
      "/file",
      {
        A: "1"
      }
    );

    expect(resolveAndNormaliseWidgetPaths).toHaveBeenCalledWith(
      widget,
      "/file",
      { A: "1" }
    );

    expect(result._resolved).toEqual({
      filepath: "/file",
      macros: { A: "1" }
    });
  });

  it("merges widget macros with parent macros (child overrides parent)", () => {
    const widget = {
      type: "root",
      macros: { B: "2" }
    } as Partial<WidgetDescription>;

    resolveWidgetPathsAndMacros(widget as WidgetDescription, "/file", {
      A: "1",
      B: "parent"
    });

    expect(resolveAndNormaliseWidgetPaths).toHaveBeenCalledWith(
      widget,
      "/file",
      {
        A: "1",
        B: "2"
      }
    );
  });

  it("recursively processes children", () => {
    const child = { type: "child" } as Partial<WidgetDescription>;
    const widget = {
      type: "root",
      children: [child]
    } as Partial<WidgetDescription>;

    const result = resolveWidgetPathsAndMacros(
      widget as WidgetDescription,
      "/file",
      {}
    );

    expect(resolveAndNormaliseWidgetPaths).toHaveBeenCalledTimes(2);

    expect(result?.children?.[0]?._resolved).toBeDefined();
  });

  it("recursively processes tabs", () => {
    const tabChild = { type: "tab-child" } as Partial<WidgetDescription>;
    const widget = {
      type: "root",
      tab: [tabChild]
    } as Partial<WidgetDescription>;

    const result = resolveWidgetPathsAndMacros(
      widget as WidgetDescription,
      "/file",
      {}
    );

    expect(resolveAndNormaliseWidgetPaths).toHaveBeenCalledTimes(2);

    expect(result.tab[0]._resolved).toBeDefined();
  });

  it("propagates merged macros to children", () => {
    const child = { type: "child" } as Partial<WidgetDescription>;
    const widget = {
      type: "root",
      macros: { B: "2" },
      children: [child]
    } as Partial<WidgetDescription>;

    resolveWidgetPathsAndMacros(widget as WidgetDescription, "/file", {
      A: "1"
    });

    expect(resolveAndNormaliseWidgetPaths).toHaveBeenNthCalledWith(
      2,
      child,
      "/file",
      {
        A: "1",
        B: "2"
      }
    );
  });

  it("handles both children and tabs together", () => {
    const child = { type: "child" } as Partial<WidgetDescription>;
    const tabChild = { type: "tab-child" } as Partial<WidgetDescription>;

    const widget = {
      type: "root",
      children: [child],
      tab: [tabChild]
    } as Partial<WidgetDescription>;

    resolveWidgetPathsAndMacros(widget as WidgetDescription, "/file", {});

    // root + child + tabChild
    expect(resolveAndNormaliseWidgetPaths).toHaveBeenCalledTimes(3);
  });

  it("works when no macros are provided", () => {
    const widget = { type: "root" } as Partial<WidgetDescription>;

    resolveWidgetPathsAndMacros(widget as WidgetDescription, "/file");

    expect(resolveAndNormaliseWidgetPaths).toHaveBeenCalledWith(
      widget,
      "/file",
      {}
    );
  });

  it("mutates and returns the same object reference", () => {
    const widget: any = { type: "root" } as Partial<WidgetDescription>;

    const result = resolveWidgetPathsAndMacros(
      widget as WidgetDescription,
      "/file",
      {}
    );

    expect(result).toBe(widget);
  });
});
