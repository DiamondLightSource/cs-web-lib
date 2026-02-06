import { Color } from "../../../types/color";
import { newAbsolutePosition } from "../../../types/position";
import { BOB_SIMPLE_PARSERS, parseBob } from "./bobParser";
import { PV } from "../../../types/pv";
import { ensureWidgetsRegistered } from "..";
import { WidgetDescription } from "../createComponent";
import { ElementCompact } from "xml-js";
ensureWidgetsRegistered();

const PREFIX = "prefix";

describe("bob widget parser", (): void => {
  const labelString = `
  <display version="2.0.0">
  <name>Display</name>
  <macros>
    <a>b</a>
  </macros>
  <x>0</x>
  <y>0</y>
  <width>300</width>
  <height>300</height>
  <widget type="label" version="2.0.0">
    <name>Label</name>
    <class>TITLE</class>
    <text>Hello</text>
    <width>550</width>
    <height>31</height>
    <visible>true</visible>
    <foreground_color>
      <color name="STOP" red="255" green="0" blue="0">
      </color>
    </foreground_color>
    <font>
      <font name="Header 1" family="Liberation Sans" style="BOLD" size="22.0">
      </font>
    </font>
    <x>10</x>
    <y>20</y>
    <not_a_property>hello</not_a_property>
    <transparent>true</transparent>
    <wrap_words>false</wrap_words>
    <rotation_step>1</rotation_step>
  </widget>
  </display>`;

  it("parses a label widget", async (): Promise<void> => {
    const widget = (await parseBob(labelString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.type).toEqual("label");
    // Boolean type
    expect(widget.visible).toEqual(true);
    // String type
    expect(widget.text).toEqual("Hello");
    // Position type
    expect(widget.position).toEqual(
      newAbsolutePosition("10px", "20px", "550px", "31px")
    );
    // Color type
    expect(widget.foregroundColor).toEqual(Color.RED);
    // Unrecognised property not passed on.
    expect(widget.not_a_property).toEqual(undefined);
    expect(widget.wrapWords).toEqual(false);
    expect(widget.transparent).toEqual(true);
    expect(widget.rotationStep).toEqual(1);
  });

  const readbackStringWithEmbeddedScript = `
  <display version="2.0.0">
    <x>0</x>
    <y>0</y>
    <width>300</width>
    <height>300</height>
    <widget type="textupdate" version="2.0.0">
      <name>Text Update</name>
      <pv_name>abc</pv_name>
      <x>12</x>
      <y>62</y>
      <width>140</width>
      <height>50</height>
      <border_alarm_sensitive>false</border_alarm_sensitive>
      <scripts>
        <script file="EmbeddedJs">
          <text>
            /* Embedded javascript */
            importClass(org.csstudio.display.builder.runtime.script.PVUtil);
            importClass(org.csstudio.display.builder.runtime.script.ScriptUtil);
            importPackage(Packages.org.csstudio.opibuilder.scriptUtil);
            logger = ScriptUtil.getLogger();
            logger.info("Hello")
            var value = PVUtil.getDouble(pvs[0]);
            if (value > 299) {
              widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(255, 255, 0));
            } else {
              widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(128, 255, 255));
            }
          </text>
          <pv_name>SR-DI-DCCT-01:SIGNAL</pv_name>
          <pv_name trigger="false">$(pv_name)</pv_name>
        </script>
      </scripts>
    </widget>
  </display>`;
  it("parses a readback widget", async (): Promise<void> => {
    const widget = (
      await parseBob(readbackStringWithEmbeddedScript, "xxx", PREFIX)
    ).children?.[0] as WidgetDescription;
    expect(widget.pvMetadataList[0].pvName).toEqual(PV.parse("xxx://abc"));
  });

  it("parses an embeded script in a widget", async (): Promise<void> => {
    const expectedScripts = [
      {
        file: "EmbeddedJs",
        pvs: [
          {
            pvName: {
              name: "SR-DI-DCCT-01:SIGNAL",
              protocol: "xxx"
            },
            trigger: true
          },
          {
            pvName: {
              name: "$(pv_name)",
              protocol: "xxx"
            },
            trigger: true
          }
        ],
        text: `
            /* Embedded javascript */
            importClass(org.csstudio.display.builder.runtime.script.PVUtil);
            importClass(org.csstudio.display.builder.runtime.script.ScriptUtil);
            importPackage(Packages.org.csstudio.opibuilder.scriptUtil);
            logger = ScriptUtil.getLogger();
            logger.info("Hello")
            var value = PVUtil.getDouble(pvs[0]);
            if (value > 299) {
              widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(255, 255, 0));
            } else {
              widget.setPropertyValue("background_color", ColorFontUtil.getColorFromRGB(128, 255, 255));
            }
          `
      }
    ];

    const widget = (
      await parseBob(readbackStringWithEmbeddedScript, "xxx", PREFIX)
    ).children?.[0] as WidgetDescription;
    expect(widget.scripts).toEqual(expectedScripts);
  });

  const noXString = `
  <display version="2.0.0">
    <y>0</y>
    <width>300</width>
    <height>300</height>
  </display>`;
  it("handles a missing dimension", async (): Promise<void> => {
    const display = await parseBob(noXString, "xxx", "PREFIX");
    // Is this correct?
    expect(display.x).toEqual(undefined);
  });

  const readbackDefaults = `
  <display version="2.0.0">
    <x>0</x>
    <y>0</y>
    <width>300</width>
    <height>300</height>
    <widget type="textupdate" version="2.0.0">
      <name>Text Update</name>
      <pv_name>abc</pv_name>
      <x>12</x>
      <y>62</y>
      <width>140</width>
      <height>50</height>
    </widget>
  </display>`;
  it("parses defaults", async (): Promise<void> => {
    const widget = (await parseBob(readbackDefaults, "xxx", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.precisionFromPv).toEqual(true);
    expect(widget.showUnits).toEqual(true);
    expect(widget.wrapWords).toEqual(true);
    expect(widget.alarmSensitive).toEqual(true);
  });

  const readbackPrecisionUnits = `
  <display version="2.0.0">
    <x>0</x>
    <y>0</y>
    <width>300</width>
    <height>300</height>
    <widget type="textupdate" version="2.0.0">
      <name>Text Update</name>
      <pv_name>abc</pv_name>
      <x>12</x>
      <y>62</y>
      <width>140</width>
      <height>50</height>
      <border_alarm_sensitive>false</border_alarm_sensitive>
      <precision>2</precision>
      <show_units>false</show_units>
    </widget>
  </display>`;
  it("parses precision and units", async (): Promise<void> => {
    const widget = (await parseBob(readbackPrecisionUnits, "xxx", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.precisionFromPv).toEqual(undefined);
    expect(widget.precision).toEqual(2);
    expect(widget.showUnits).toEqual(false);
  });

  const readbackStringFormat = `
  <display version="2.0.0">
    <x>0</x>
    <y>0</y>
    <width>300</width>
    <height>300</height>
    <widget type="textupdate" version="2.0.0">
      <name>Text Update</name>
      <pv_name>abc</pv_name>
      <x>12</x>
      <y>62</y>
      <width>140</width>
      <height>50</height>
      <border_alarm_sensitive>false</border_alarm_sensitive>
      <format>6</format>
    </widget>
  </display>`;
  it("parses string format", async (): Promise<void> => {
    const widget = (await parseBob(readbackStringFormat, "xxx", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.formatType).toEqual("string");
  });
});

describe("bobParseSymbols", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_text, bobParseSymbols] = BOB_SIMPLE_PARSERS.symbols;
  it("returns array of strings when `symbol` has multiple items (strings and {_text})", () => {
    const input: ElementCompact = {
      symbol: {
        0: "item1",
        1: { _text: "item2" },
        2: "item3",
        foo: { _text: "item4" }
      }
    };

    const result = bobParseSymbols(input);

    expect(result).toEqual(["item1", "item2", "item3", "item4"]);
  });

  it("returns array with a single value when `symbol` has a single item as string", () => {
    const input: ElementCompact = {
      symbol: {
        only: "AAPL"
      }
    };

    const result = bobParseSymbols(input);
    expect(result).toEqual(["AAPL"]);
  });

  it("returns array with a single value when `symbol` has a single item as object with `_text`", () => {
    const input: ElementCompact = {
      symbol: {
        only: { _text: "AAPL" }
      }
    };

    const result = bobParseSymbols(input);
    expect(result).toEqual(["AAPL"]);
  });

  it("returns string when `_text` exists and `symbol` does not", () => {
    const input: ElementCompact = {
      _text: "SingleTextValue"
    };

    const result = bobParseSymbols(input);
    expect(result).toBe("SingleTextValue");
  });

  it("prefers `symbol` over `_text` when both are present", () => {
    const input: ElementCompact = {
      symbol: {
        0: "TSLA",
        1: { _text: "AMZN" }
      },
      _text: "ShouldBeIgnored"
    };

    const result = bobParseSymbols(input);
    expect(result).toEqual(["TSLA", "AMZN"]);
  });

  it("returns empty array when neither `symbol` nor `_text` is present", () => {
    const input: ElementCompact = {
      someOtherProp: 42
    };

    const result = bobParseSymbols(input);
    expect(result).toEqual([]);
  });

  it("returns empty array when input is an empty object", () => {
    const input: ElementCompact = {};
    const result = bobParseSymbols(input);
    expect(result).toEqual([]);
  });

  it("returns empty array when `symbol` is an empty object", () => {
    const input: ElementCompact = { symbol: {} };

    const result = bobParseSymbols(input);
    expect(result).toEqual([]);
  });

  it("coerces `_text` to string when `_text` is numeric-like", () => {
    const input: ElementCompact = { _text: 12345 };

    const result = bobParseSymbols(input);
    expect(result).toBe("12345");
  });

  it("does not throw when all `symbol` items are either strings or objects with `_text`", () => {
    const input: ElementCompact = {
      symbol: {
        a: "IBM",
        b: { _text: "ORCL" }
      }
    };

    expect(() => bobParseSymbols(input)).not.toThrow();
    expect(bobParseSymbols(input)).toEqual(["IBM", "ORCL"]);
  });
});
