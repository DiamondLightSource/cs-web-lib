import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStyle } from "./useStyle";
import { useTheme } from "@mui/material";
import { FontStyle, newFont } from "../../types/font";
import { WidgetAction } from "../widgets/widgetActions";

vi.mock("@mui/material", () => ({
  useTheme: vi.fn()
}));

const mockTheme = {
  palette: {
    primary: {
      main: "#123456",
      contrastText: "#ffffff",
      light: "#abcdef"
    },
    widgetA: {
      main: "#654321",
      contrastText: "#000000",
      light: "#fedcba"
    }
  },
  borders: {
    default: {
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "black",
      borderRadius: 2
    },
    widgetA: {
      borderStyle: "dashed",
      borderWidth: 2,
      borderColor: "red",
      borderRadius: 4
    }
  },
  typography: { fontSize: 14 }
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTheme).mockReturnValue(mockTheme);
});

describe("useStyle", () => {
  it("returns primary palette colors when no widgetName provided", () => {
    const { result } = renderHook(() => useStyle({}));

    expect(result.current.colors.color).toBe("#ffffff"); // contrastText
    expect(result.current.colors.backgroundColor).toBe("#123456"); // main
  });

  it("uses widget-specific palette when widgetName matches", () => {
    const { result } = renderHook(() => useStyle({}, "widgetA"));

    expect(result.current.colors.color).toBe("#000000");
    expect(result.current.colors.backgroundColor).toBe("#654321");
  });

  it("returns transparent background when transparent=true", () => {
    const { result } = renderHook(() =>
      useStyle({ transparent: true }, "widgetA")
    );

    expect(result.current.colors.backgroundColor).toBe("transparent");
  });

  it("applies provided foreground and background colors", () => {
    const { result } = renderHook(() =>
      useStyle({
        foregroundColor: { colorString: "pink" },
        backgroundColor: { colorString: "blue" }
      })
    );

    expect(result.current.colors.color).toBe("pink");
    expect(result.current.colors.backgroundColor).toBe("blue");
  });

  it("applies widget-specific border overrides", () => {
    const { result } = renderHook(() => useStyle({}, "widgetA"));

    expect(result.current.border).toEqual({
      borderStyle: "dashed",
      borderWidth: 2,
      borderColor: "red",
      borderRadius: 4
    });
  });

  it("falls back to theme border when no custom border given", () => {
    const { result } = renderHook(() => useStyle({}, "widgetA"));

    expect(result.current.border).toEqual({
      borderStyle: "dashed",
      borderWidth: 2,
      borderColor: "red",
      borderRadius: 4
    });
  });

  it("returns customColors, overriding only matching keys", () => {
    const { result } = renderHook(() =>
      useStyle(
        {
          customColors: {
            light: { colorString: "#ff00ff" }
          }
        },
        "widgetA"
      )
    );

    expect(result.current.customColors).toEqual({
      light: "#ff00ff"
    });
  });

  it("uses provided font when fontToCss returns a value", () => {
    const font = newFont(12, FontStyle.Bold, "Liberation sans", "abc");
    const { result } = renderHook(() => useStyle({ font }));

    expect(result.current.font?.fontSize).toEqual(
      `${(font.size as number) / 16}rem`
    );
    expect(result.current.font?.fontFamily).toEqual(
      "Liberation sans,sans-serif"
    );
    expect(result.current.font?.fontWeight).toEqual("bold");
    expect(result.current.font?.fontStyle).toEqual("normal");
  });

  it("falls back to theme typography when no font provided", () => {
    const { result } = renderHook(() => useStyle({}));

    expect(result.current.font).toEqual(mockTheme.typography);
  });

  it("cursor is pointer when actions exist", () => {
    const { result } = renderHook(() =>
      useStyle({
        actions: {
          executeAsOne: true,
          actions: [
            {
              type: "EXIT",
              exitInfo: {}
            } as WidgetAction
          ]
        }
      })
    );

    expect(result.current.other.cursor).toBe("pointer");
  });

  it("cursor is auto when no actions exist", () => {
    const { result } = renderHook(() => useStyle({}));

    expect(result.current.other.cursor).toBe("auto");
  });

  it("visibility is hidden when visible=false", () => {
    const { result } = renderHook(() => useStyle({ visible: false }));

    expect(result.current.other.visibility).toBe("hidden");
  });

  it("visibility defaults to visible", () => {
    const { result } = renderHook(() => useStyle({}));

    expect(result.current.other.visibility).toBe("visible");
  });
});
