import { describe, it, expect, vi, beforeEach } from "vitest";
import { scriptParser } from "./scriptParser";
import { ElementCompact } from "xml-js";
import * as opiParserModule from "../opiParser";
import { PV } from "../../../../types";

vi.mock("../opiParser", () => ({
  opiParsePvName: vi.fn()
}));

describe("scriptParser", () => {
  const PV1 = new PV("pv1:processed", "ca");
  const PV2 = new PV("pv2:processed", "ca");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(opiParserModule.opiParsePvName)
      .mockReturnValueOnce(PV1)
      .mockReturnValueOnce(PV2);
  });

  it("should return an empty array when jsonProp has no scripts", () => {
    const jsonProp: ElementCompact = {};
    const result = scriptParser(jsonProp, "ca", true);
    expect(result).toEqual([]);
  });

  it("should parse OPI file scripts correctly", () => {
    const pv1 = { _attributes: { trig: "true" } };
    const pv2 = { _attributes: { trig: "false" } };

    const scriptElement = {
      script: {
        _attributes: { file: "test.js" },
        text: { _cdata: 'console.log("Hello")' },
        pv: [pv1, pv2]
      }
    };

    const jsonProp: ElementCompact = {
      scripts: [scriptElement]
    };

    const result = scriptParser(jsonProp, "ca", true);

    expect(result).toEqual([
      {
        file: "test.js",
        text: 'console.log("Hello")',
        pvs: [
          { pvName: PV1, trigger: true },
          { pvName: PV2, trigger: false }
        ]
      }
    ]);

    expect(opiParserModule.opiParsePvName).toHaveBeenCalledTimes(2);
  });

  it("should parse non-OPI file scripts correctly", () => {
    const pv1 = { _attributes: {} };
    const pv2 = { _attributes: {} };

    const scriptElement = {
      script: {
        _attributes: { file: "test.js" },
        text: { _text: 'console.log("Hello")' },
        pv_name: [pv1, pv2]
      }
    };

    const jsonProp: ElementCompact = {
      scripts: [scriptElement]
    };

    const result = scriptParser(jsonProp, "ca", false);

    expect(result).toEqual([
      {
        file: "test.js",
        text: 'console.log("Hello")',
        pvs: [
          { pvName: PV1, trigger: true },
          { pvName: PV2, trigger: true }
        ]
      }
    ]);

    expect(opiParserModule.opiParsePvName).toHaveBeenCalledTimes(2);
  });

  it("should handle scripts with no file attribute", () => {
    const scriptElement = {
      script: {
        text: { _text: 'console.log("No file")' },
        pv: []
      }
    };

    const jsonProp: ElementCompact = {
      scripts: [scriptElement]
    };

    const result = scriptParser(jsonProp, "ca", true);

    expect(result).toEqual([
      {
        file: undefined,
        text: 'console.log("No file")',
        pvs: []
      }
    ]);
  });

  it("should handle scripts with no text content", () => {
    const scriptElement = {
      script: {
        _attributes: { file: "empty.js" },
        pv: []
      }
    };

    const jsonProp: ElementCompact = {
      scripts: [scriptElement]
    };

    const result = scriptParser(jsonProp, "ca", true);

    expect(result).toEqual([
      {
        file: "empty.js",
        text: "",
        pvs: []
      }
    ]);
  });

  it("should handle multiple scripts in the array", () => {
    const scriptElement1 = {
      script: {
        _attributes: { file: "script1.js" },
        text: { _cdata: 'print("Script 1")' },
        pv: []
      }
    };

    const scriptElement2 = {
      script: {
        _attributes: { file: "script2.js" },
        text: { _cdata: 'print("Script 2")' },
        pv: []
      }
    };

    const jsonProp: ElementCompact = {
      scripts: [scriptElement1, scriptElement2]
    };

    const result = scriptParser(jsonProp, "ca", true);

    expect(result).toEqual([
      {
        file: "script1.js",
        text: 'print("Script 1")',
        pvs: []
      },
      {
        file: "script2.js",
        text: 'print("Script 2")',
        pvs: []
      }
    ]);
  });

  it("should handle single script not in array format", () => {
    const scriptElement = {
      script: {
        _attributes: { file: "single.js" },
        text: { _text: 'print("Single")' },
        pv: []
      }
    };

    const jsonProp: ElementCompact = {
      scripts: scriptElement
    };

    const result = scriptParser(jsonProp, "ca", true);

    expect(result).toEqual([
      {
        file: "single.js",
        text: 'print("Single")',
        pvs: []
      }
    ]);
  });
});
