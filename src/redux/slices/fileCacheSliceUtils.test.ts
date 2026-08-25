import { describe, it, expect, vi } from "vitest";
import {
  deleteWidgetById,
  resolveWidgetPathsAndMacros
} from "./fileCacheSliceUtils";
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

const DEFAULT_WIDGET = { type: "display", fileId: "test" };

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

describe("deleteWidgetById()", () => {
  it("returns undefined when children are undefined", () => {
    expect(deleteWidgetById(undefined, "widget-1")).toBeUndefined();
  });

  it("returns an empty array when no children", () => {
    expect(deleteWidgetById([], "widget-1")).toEqual([]);
  });

  it("deletes a widget from the top level", () => {
    const children = [
      { ...DEFAULT_WIDGET, id: "widget-1" },
      { ...DEFAULT_WIDGET, id: "widget-2" }
    ];

    expect(deleteWidgetById(children, "widget-1")).toEqual([
      { type: "display", fileId: "test", id: "widget-2" }
    ]);
  });

  it("keeps all widgets when the id to delete does not exist", () => {
    const children = [
      { ...DEFAULT_WIDGET, id: "widget-1" },
      { ...DEFAULT_WIDGET, id: "widget-2" }
    ];

    expect(deleteWidgetById(children, "widget-3")).toEqual([
      { type: "display", fileId: "test", id: "widget-1" },
      { type: "display", fileId: "test", id: "widget-2" }
    ]);
  });

  it("deletes a nested widget", () => {
    const children = [
      {
        ...DEFAULT_WIDGET,
        id: "parent",
        children: [
          { ...DEFAULT_WIDGET, id: "child-1" },
          { ...DEFAULT_WIDGET, id: "child-2" }
        ]
      }
    ];
    expect(deleteWidgetById(children, "child-1")).toEqual([
      {
        type: "display",
        fileId: "test",
        id: "parent",
        children: [{ type: "display", fileId: "test", id: "child-2" }]
      }
    ]);
  });

  it("returns an empty children array when the last nested widget is deleted", () => {
    const children = [
      {
        ...DEFAULT_WIDGET,
        id: "parent",
        children: [{ ...DEFAULT_WIDGET, id: "child" }]
      }
    ];
    expect(deleteWidgetById(children, "child")).toEqual([
      {
        type: "display",
        fileId: "test",
        id: "parent",
        children: []
      }
    ]);
  });
});
