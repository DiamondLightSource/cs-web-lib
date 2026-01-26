import log from "loglevel";
import { Color } from "../../../types/color";
import { Border } from "../../../types/border";
import { Rule } from "../../../types/props";
import {
  normalisePath,
  opiParseRules,
  opiPatchRules,
  parseOpi
} from "./opiParser";
import { AbsolutePosition, RelativePosition } from "../../../types/position";
import { ensureWidgetsRegistered } from "..";
import { WidgetDescription } from "../createComponent";
import { ElementCompact } from "xml-js";
import { ParserDict } from "./parser";

ensureWidgetsRegistered();

const PREFIX = "prefix/pmacApp_opi";

describe("opi widget parser", (): void => {
  const displayString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>10</x>
    <y>20</y>
    <width>30</width>
    <height>40</height>
  </display>`;
  it("parses a display widget", async (): Promise<void> => {
    const displayWidget = await parseOpi(displayString, "ca", PREFIX);
    expect(displayWidget.position).toEqual(
      new RelativePosition("0px", "0px", "30px", "40px")
    );
  });
  const labelString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.Label" version="1.0.0">
      <actions hook="false" hook_all="false" />
      <auto_size>false</auto_size>
      <background_color>
        <color name="Canvas" red="200" green="200" blue="200" />
      </background_color>
      <border_color>
        <color name="Black" red="0" green="0" blue="0" />
      </border_color>
      <border_style>0</border_style>
      <border_width>0</border_width>
      <enabled>true</enabled>
      <font>
        <opifont.name fontName="Liberation Sans" height="15" style="0" pixels="true">Default</opifont.name>
      </font>
      <foreground_color>
        <color name="Text: FG" red="0" green="0" blue="0" />
      </foreground_color>
      <height>20</height>
      <horizontal_alignment>1</horizontal_alignment>
      <name>Label</name>
      <rules />
      <scale_options>
        <width_scalable>true</width_scalable>
        <height_scalable>true</height_scalable>
        <keep_wh_ratio>false</keep_wh_ratio>
      </scale_options>
      <scripts />
      <text>Hello</text>
      <tooltip></tooltip>
      <transparent>true</transparent>
      <vertical_alignment>1</vertical_alignment>
      <visible>true</visible>
      <widget_type>Label</widget_type>
      <width>120</width>
      <wrap_words>false</wrap_words>
      <wuid>7f37486f:17080909483:-5484</wuid>
      <x>370</x>
      <y>20</y>
    </widget>
  </display>`;

  it("parses a label widget", async (): Promise<void> => {
    const widget = (await parseOpi(labelString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.type).toEqual("label");
    // Boolean type
    expect(widget.visible).toEqual(true);
    // String type
    expect(widget.text).toEqual("Hello");
    // Position type
    expect(widget.position).toEqual(
      new AbsolutePosition("370px", "20px", "120px", "20px")
    );
    // Color type
    expect(widget.foregroundColor).toEqual(Color.BLACK);
    // Unrecognised property not passed on.
    expect(widget.wuid).toEqual(undefined);
    // No border
    expect(widget.border).toEqual(Border.NONE);
    // No actions
    expect(widget.actions.actions.length).toEqual(0);
    // One rule
    expect(widget.rules.length).toEqual(0);
  });

  const ruleString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.Label" version="1.0.0">
      <x>0</x>
      <y>0</y>
      <height>20</height>
      <width>20</width>
      <rules>
        <rule name="Rule" prop_id="text" out_exp="true">
          <exp bool_exp="pv0&gt;5">
            <value>pv0</value>
          </exp>
          <exp bool_exp="true">
            <value>"nope"</value>
          </exp>
          <pv trig="true">loc://test</pv>
        </rule>
      </rules>
    </widget>
  </display>`;

  it("parses a widget with a rule", async (): Promise<void> => {
    const widget = (await parseOpi(ruleString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.rules.length).toEqual(1);
    const rule: Rule = widget.rules[0];
    expect(rule.name).toEqual("Rule");
    expect(rule.prop).toEqual("text");
    expect(rule.outExp).toEqual(true);
    expect(rule.pvs[0].pvName.qualifiedName()).toEqual("loc://test");
    expect(rule.pvs[0].trigger).toEqual(true);
    expect(rule.expressions[0].value).toEqual({ _text: "pv0" });
    expect(rule.expressions[0].convertedValue).toEqual("pv0");
  });
  const childString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.Label" version="1.0.0">
      <x>0</x>
      <y>0</y>
      <height>20</height>
      <width>20</width>
      <text>hello</text>
      <widget typeId="org.csstudio.opibuilder.widgets.Label" version="1.0.0">
        <x>0</x>
        <y>0</y>
        <height>20</height>
        <width>20</width>
        <text>bye</text>
      </widget>
    </widget>
  </display>`;

  it("parses a widget with a child widget", async (): Promise<void> => {
    const widget = (await parseOpi(childString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.children?.length).toEqual(1);
  });

  const actionString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.ActionButton" version="2.0.0">
      <x>0</x>
      <y>0</y>
      <height>20</height>
      <width>20</width>
      <actions hook="true" hook_all="false">
        <action type="OPEN_DISPLAY">
          <path>../dlsPLCApp_opi/vacValve_detail.opi</path>
          <macros></macros>
          <Position>1</Position>
          <description>Open OPI</description>
        </action>
      </actions>
    </widget>
  </display>`;

  it("parses a widget with an action", async (): Promise<void> => {
    const widget = (await parseOpi(actionString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.actions.actions.length).toEqual(1);
    const action = widget.actions.actions[0];
    expect(action.type).toEqual("OPEN_TAB");
    // Relative paths handled.
    expect(action.dynamicInfo.file.path).toEqual(
      "prefix/dlsPLCApp_opi/vacValve_detail.opi"
    );
    expect(action.dynamicInfo.description).toEqual("Open OPI");
  });
  const inputString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.TextInput" version="2.0.0">
      <confirm_message></confirm_message>
      <height>100</height>
      <horizontal_alignment>2</horizontal_alignment>
      <border_alarm_sensitive>false</border_alarm_sensitive>
      <limits_from_pv>false</limits_from_pv>
      <maximum>1.7976931348623157E308</maximum>
      <minimum>-1.7976931348623157E308</minimum>
      <multiline_input>false</multiline_input>
      <name>EDM TextInput</name>
      <precision>0</precision>
      <precision_from_pv>true</precision_from_pv>
      <pv_name>SR-CS-RFFB-01:RFSTEP</pv_name>
      <pv_value />
      <scale_options>
        <width_scalable>true</width_scalable>
        <height_scalable>true</height_scalable>
        <keep_wh_ratio>false</keep_wh_ratio>
      </scale_options>
      <selector_type>0</selector_type>
      <show_units>false</show_units>
      <style>0</style>
      <text></text>
      <tooltip>$(pv_name)
  $(pv_value)</tooltip>
      <transparent>true</transparent>
      <visible>true</visible>
      <widget_type>Text Input</widget_type>
      <width>114</width>
      <wuid>-7ec79ac:158f319c58c:-7c7e</wuid>
      <x>197</x>
      <y>228</y>
    </widget>
  </display>`;

  it("parses an input widget", async (): Promise<void> => {
    const widget = (await parseOpi(inputString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.textAlign).toEqual("right");
    // Adds ca:// prefix.
    expect(widget.pvName.qualifiedName()).toEqual("ca://SR-CS-RFFB-01:RFSTEP");
  });

  const invalidString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.TextInput" version="2.0.0">
      <text />
    </widget>
  </display>`;
  it("doesn't parse an invalid string", async (): Promise<void> => {
    // Reduce logging when expecting error.
    log.setLevel("error");
    const widget = (await parseOpi(invalidString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.text).toBeUndefined();
    log.setLevel("info");
  });
  const invalidBool = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0.0">
    <x>0</x>
    <y>0</y>
    <height>20</height>
    <width>20</width>
    <widget typeId="org.csstudio.opibuilder.widgets.TextInput" version="2.0.0">
      <text />
      <enabled>not-a-bool</enabled>
    </widget>
  </display>`;
  it("doesn't parse an invalid bool", async (): Promise<void> => {
    // Reduce logging when expecting error.
    log.setLevel("error");
    const widget = (await parseOpi(invalidBool, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.enabled).toBeUndefined();
    log.setLevel("info");
  });
  const xygraphString = `
  <display typeId="org.csstudio.opibuilder.Display" version="1.0">
  <x>87</x>
  <y>387</y>
  <width>456</width>
  <height>473</height>
  <font>
    <fontdata fontName="helvetica" height="8" pixels="true" style="0" />
  </font>
  <foreground_color>
    <color blue="0" green="0" name="Black" red="0" />
  </foreground_color>
  <background_color>
    <color blue="200" green="200" name="Canvas" red="200" />
  </background_color>
  <show_grid>true</show_grid>
  <widget typeId="org.csstudio.opibuilder.widgets.dawn.xygraph" version="1.0">
    <axis_0_auto_scale>false</axis_0_auto_scale>
    <axis_0_auto_scale_threshold>0.95</axis_0_auto_scale_threshold>
    <axis_0_axis_color>
      <color blue="0" green="0" name="Black" red="0" />
    </axis_0_axis_color>
    <axis_0_axis_title />
    <axis_0_grid_color>
      <color blue="0" green="0" name="Black" red="0" />
    </axis_0_grid_color>
    <axis_0_log_scale>false</axis_0_log_scale>
    <axis_0_maximum>1024.0</axis_0_maximum>
    <axis_0_minimum>-10.0</axis_0_minimum>
    <axis_0_scale_font>
      <fontdata fontName="helvetica" height="12" pixels="true" style="0" />
    </axis_0_scale_font>
    <axis_0_show_grid>false</axis_0_show_grid>
    <axis_0_time_format>0</axis_0_time_format>
    <axis_0_title_font>
      <fontdata fontName="helvetica" height="12" pixels="true" style="0" />
    </axis_0_title_font>
    <axis_0_visible>true</axis_0_visible>
    <axis_1_auto_scale>true</axis_1_auto_scale>
    <axis_1_auto_scale_threshold>0.95</axis_1_auto_scale_threshold>
    <axis_1_axis_color>
      <color blue="0" green="0" name="Black" red="0" />
    </axis_1_axis_color>
    <axis_1_axis_title />
    <axis_1_grid_color>
      <color blue="0" green="0" name="Black" red="0" />
    </axis_1_grid_color>
    <axis_1_logScale>false</axis_1_logScale>
    <axis_1_log_scale>false</axis_1_log_scale>
    <axis_1_maximum>1.0</axis_1_maximum>
    <axis_1_minimum>0.0</axis_1_minimum>
    <axis_1_scale_font>
      <fontdata fontName="helvetica" height="12" pixels="true" style="0" />
    </axis_1_scale_font>
    <axis_1_show_grid>false</axis_1_show_grid>
    <axis_1_time_format>0</axis_1_time_format>
    <axis_1_title_font>
      <fontdata fontName="helvetica" height="12" pixels="true" style="0" />
    </axis_1_title_font>
    <axis_1_visible>true</axis_1_visible>
    <axis_2_auto_scale>true</axis_2_auto_scale>
    <axis_2_axis_color>
      <color blue="0" green="0" name="Black" red="0" />
    </axis_2_axis_color>
    <axis_2_axis_title />
    <axis_2_grid_color>
      <color blue="0" green="0" name="Black" red="0" />
    </axis_2_grid_color>
    <axis_2_left_bottom_side>false</axis_2_left_bottom_side>
    <axis_2_logScale>false</axis_2_logScale>
    <axis_2_maximum>16600.0</axis_2_maximum>
    <axis_2_minimum>8300.0</axis_2_minimum>
    <axis_2_show_grid>false</axis_2_show_grid>
    <axis_2_time_format>0</axis_2_time_format>
    <axis_2_visible>false</axis_2_visible>
    <axis_count>3</axis_count>
    <background_color>
      <color blue="200" green="200" name="Canvas" red="200" />
    </background_color>
    <border_alarm_sensitive>false</border_alarm_sensitive>
    <border_style>0</border_style>
    <border_width>0</border_width>
    <font>
      <fontdata fontName="helvetica" height="12" pixels="true" style="0" />
    </font>
    <foreground_color>
      <color blue="0" green="0" name="Black" red="0" />
    </foreground_color>
    <height>200</height>
    <name>EDM xyGraph</name>
    <plot_area_background_color>
      <color blue="200" green="200" name="Canvas" red="200" />
    </plot_area_background_color>
    <pv_name>$(trace_0_y_pv)</pv_name>
    <show_legend>false</show_legend>
    <show_plot_area_border>false</show_plot_area_border>
    <show_toolbar>false</show_toolbar>
    <title>Bunch motion standard deviation</title>
    <title_font>
      <fontdata fontName="helvetica" height="12" pixels="true" style="0" />
    </title_font>
    <tooltip>$(trace_0_y_pv)
$(trace_0_y_pv_value)</tooltip>
    <trace_0_anti_alias>false</trace_0_anti_alias>
    <trace_0_buffer_size>65536</trace_0_buffer_size>
    <trace_0_concatenate_data>false</trace_0_concatenate_data>
    <trace_0_trace_color>
      <color blue="192" green="0" name="blue-27" red="0" />
    </trace_0_trace_color>
    <trace_0_trace_type>0</trace_0_trace_type>
    <trace_0_update_delay>0</trace_0_update_delay>
    <trace_0_update_mode>3</trace_0_update_mode>
    <trace_0_y_pv>$(device):$(adc_axis):ADC:MMS:STD</trace_0_y_pv>
    <trace_count>1</trace_count>
    <width>440</width>
    <x>8</x>
    <y>168</y>
  </widget>
  </display>`;
  it("parses xygraph widget", async (): Promise<void> => {
    const widget = (await parseOpi(xygraphString, "ca", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.traces.length).toEqual(1);
    expect(widget.axes.length).toEqual(3);
    expect(widget.traces[0].bufferSize).toEqual(65536);
    expect(widget.axes[2].onRight).toEqual(true);
  });
});

describe("normalisePath", (): void => {
  it("returns path when no other arguments are specified", async (): Promise<void> => {
    const result = normalisePath("/a/path");
    expect(result).toBe("/a/path");
  });

  it("returns path without .. when no other arguments are specified and path starts with ../", async (): Promise<void> => {
    const result = normalisePath("../../a/path");
    expect(result).toBe("/a/path");
  });

  it("Joins path and parent when parent is a valid url", async (): Promise<void> => {
    const result = normalisePath("/a/path", "http://test.diamond.ac.uk/");
    expect(result).toBe("http://test.diamond.ac.uk/a/path");
  });

  it("Joins path and parent when parent is a path", async (): Promise<void> => {
    const result = normalisePath("/a/path", "/parent/path");
    expect(result).toBe("/parent/path/a/path");
  });

  it("Joins path when path contains .. and removes trailing folders from paren path", async (): Promise<void> => {
    const result = normalisePath("../a/path", "/parent/path");
    expect(result).toBe("/parent/a/path");
  });

  it("Returns path if path is a valid url", async (): Promise<void> => {
    const result = normalisePath(
      "https://anothertest.diamond.ac.uk/a/path",
      "http://test.diamond.ac.uk/"
    );
    expect(result).toBe("https://anothertest.diamond.ac.uk/a/path");
  });

  it("Does not substitute macros if macros undefined", async (): Promise<void> => {
    const result = normalisePath(
      "$(some_macro)/$(another_macro)/path",
      "$(another_macro)/parent"
    );
    expect(result).toBe(
      "$(another_macro)/parent/$(some_macro)/$(another_macro)/path"
    );
  });

  it("Substitutes macros into path if macros defined", async (): Promise<void> => {
    const result = normalisePath(
      "$(some_macro)/$(another_macro)/path",
      "$(another_macro)/parent",
      {
        some_macro: "macroPath",
        another_macro: "anotherMacroPath",
        absent_macro: "no_match"
      }
    );
    expect(result).toBe(
      "$(another_macro)/parent/macroPath/anotherMacroPath/path"
    );
  });

  it("Substitutes macros into path, returns path if path becomes a fully qualified url", async (): Promise<void> => {
    const result = normalisePath(
      "$(some_macro)/$(another_macro)/path",
      "$(another_macro)/parent",
      {
        some_macro: "http://test.diamond.ac.uk",
        another_macro: "anotherMacroPath",
        absent_macro: "no_match"
      }
    );
    expect(result).toBe("http://test.diamond.ac.uk/anotherMacroPath/path");
  });
});

describe("opiParseRules", () => {
  const defaultProtocol = "ca";

  it("returns an empty array when jsonProp.rules is missing", () => {
    const input: ElementCompact = {};
    const result = opiParseRules(input, defaultProtocol, true);
    expect(result).toEqual([]);
  });

  it("returns an empty array when jsonProp.rules exists but has no rule", () => {
    const input: ElementCompact = {
      rules: { rule: undefined }
    };
    const result = opiParseRules(input, defaultProtocol, true);
    expect(result).toEqual([]);
  });

  it("parses a single rule with with isOpiFile = false and with multiple pvs with trig true and false", () => {
    const input: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "Rule A",
            prop_id: "background_color",
            out_exp: "true"
          },
          pv: [
            { _attributes: { trig: "true" }, _text: "SYS:PV1" },
            { _text: "SYS:PV2" },
            { _attributes: { trig: "false" }, _text: "SYS:PV3" }
          ],
          exp: [
            { _attributes: { bool_exp: "pv0 > 10" }, value: 1 },
            { _attributes: { bool_exp: "pv1 == 0" }, value: "OFF" }
          ]
        }
      }
    };

    const result = opiParseRules(input, defaultProtocol, true);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Rule A",
      prop: "background_color",
      outExp: true
    });

    expect(result[0].pvs).toHaveLength(3);

    expect(result[0].pvs[0]?.trigger).toBe(true);
    expect(result[0].pvs[0]?.pvName?.toString()).toBe(
      `${defaultProtocol}://SYS:PV1`
    );

    expect(result[0].pvs[1]?.trigger).toBe(false);
    expect(result[0].pvs[1]?.pvName?.toString()).toBe(
      `${defaultProtocol}://SYS:PV2`
    );

    expect(result[0].pvs[2]?.trigger).toBe(false);
    expect(result[0].pvs[2]?.pvName?.toString()).toBe(
      `${defaultProtocol}://SYS:PV3`
    );

    expect(result[0].expressions).toEqual([
      { boolExp: "pv0 > 10", value: 1 },
      { boolExp: "pv1 == 0", value: "OFF" }
    ]);
  });

  it("parses a single rule with isOpiFile = false and <pv_name> nodes, trigger always true", () => {
    const input: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "Rule B",
            prop_id: "visible",
            out_exp: "false"
          },
          pv_name: { _text: "DEV:STAT" }, // single -> toArray -> [single]
          exp: { _attributes: { bool_exp: "pv0 == 1" }, value: true }
        }
      }
    };

    const result = opiParseRules(input, defaultProtocol, false);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "Rule B",
      prop: "visible",
      outExp: false
    });

    expect(result[0].pvs).toHaveLength(1);

    expect(result[0].pvs[0]?.trigger).toBe(true);
    expect(result[0].pvs[0]?.pvName?.toString()).toBe(
      `${defaultProtocol}://DEV:STAT`
    );

    expect(result[0].expressions).toEqual([
      { boolExp: "pv0 == 1", value: true }
    ]);
  });

  it("handles multiple rules", () => {
    const input: ElementCompact = {
      rules: {
        rule: [
          {
            _attributes: {
              name: "Rule1",
              prop_id: "width",
              out_exp: "true"
            },
            pv: { _text: "A:PV" },
            exp: { _attributes: { bool_exp: "pv0 > 5" }, value: 100 }
          },
          {
            _attributes: {
              name: "Rule2",
              prop_id: "height",
              out_exp: "false"
            },
            pv: [{ _text: "B:PV1" }, { _text: "B:PV2" }],
            exp: [
              { _attributes: { bool_exp: "pv0 < 0" }, value: 10 },
              { _attributes: { bool_exp: "pv1 >= 0" }, value: 20 }
            ]
          }
        ]
      }
    };

    const result = opiParseRules(input, defaultProtocol, true);

    expect(result).toHaveLength(2);

    // Rule1
    expect(result[0]).toMatchObject({
      name: "Rule1",
      prop: "width",
      outExp: true
    });
    expect(result[0].pvs).toHaveLength(1);
    expect(result[0].pvs[0]?.trigger).toBe(false);
    expect(result[0].pvs[0]?.pvName?.toString()).toBe(
      `${defaultProtocol}://A:PV`
    );
    expect(result[0].expressions).toEqual([{ boolExp: "pv0 > 5", value: 100 }]);

    expect(result[1]).toMatchObject({
      name: "Rule2",
      prop: "height",
      outExp: false
    });
    expect(result[1].pvs).toHaveLength(2);
    expect(result[1].pvs[0]?.trigger).toBe(false);
    expect(result[1].pvs[0]?.pvName?.toString()).toBe(
      `${defaultProtocol}://B:PV1`
    );
    expect(result[1].pvs[1]?.trigger).toBe(false);
    expect(result[1].pvs[1]?.pvName?.toString()).toBe(
      `${defaultProtocol}://B:PV2`
    );
    expect(result[1].expressions).toEqual([
      { boolExp: "pv0 < 0", value: 10 },
      { boolExp: "pv1 >= 0", value: 20 }
    ]);
  });

  it('treats out_exp strictly equal to "true"', () => {
    const inputTrue: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "R1",
            prop_id: "alpha",
            out_exp: "true"
          },
          pv: { _text: "PVX" },
          exp: { _attributes: { bool_exp: "pv0 == 1" }, value: 1 }
        }
      }
    };

    const inputFalse: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "R2",
            prop_id: "beta",
            out_exp: "false"
          },
          pv: { _text: "PVY" },
          exp: { _attributes: { bool_exp: "pv0 == 1" }, value: 1 }
        }
      }
    };

    const r1 = opiParseRules(inputTrue, defaultProtocol, true);
    const r2 = opiParseRules(inputFalse, defaultProtocol, true);

    expect(r1[0].outExp).toBe(true);
    expect(r2[0].outExp).toBe(false);
  });

  it("handles absent exp gracefully (empty expressions array)", () => {
    const input: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "NoExp",
            prop_id: "gamma",
            out_exp: "true"
          },
          pv: { _text: "PVZ" }
        }
      }
    };

    const result = opiParseRules(input, defaultProtocol, true);

    expect(result).toHaveLength(1);
    expect(result[0].expressions).toEqual([]);
  });

  it("handles absent pv/pv_name gracefully (empty pvs array)", () => {
    const inputOpi: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "NoPV",
            prop_id: "delta",
            out_exp: "true"
          },
          exp: { _attributes: { bool_exp: "true" }, value: 42 }
        }
      }
    };

    const resultOpi = opiParseRules(inputOpi, defaultProtocol, true);
    expect(resultOpi).toHaveLength(1);
    expect(resultOpi[0].pvs).toEqual([]);

    const inputNonOpi: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "NoPVNonOpi",
            prop_id: "epsilon",
            out_exp: "false"
          },
          exp: { _attributes: { bool_exp: "false" }, value: 0 }
        }
      }
    };

    const resultNonOpi = opiParseRules(inputNonOpi, defaultProtocol, false);
    expect(resultNonOpi).toHaveLength(1);
    expect(resultNonOpi[0].pvs).toEqual([]);
  });

  it("preserves expression value types (number, string, boolean, object)", () => {
    const input: ElementCompact = {
      rules: {
        rule: {
          _attributes: {
            name: "Types",
            prop_id: "zeta",
            out_exp: "true"
          },
          pv: { _text: "PV:TYPES" },
          exp: [
            { _attributes: { bool_exp: "true" }, value: 123 },
            { _attributes: { bool_exp: "true" }, value: "text" },
            { _attributes: { bool_exp: "true" }, value: false },
            { _attributes: { bool_exp: "true" }, value: { k: "v" } }
          ]
        }
      }
    };

    const result = opiParseRules(input, defaultProtocol, true);
    expect(result).toHaveLength(1);
    expect(result[0].expressions).toEqual([
      { boolExp: "true", value: 123 },
      { boolExp: "true", value: "text" },
      { boolExp: "true", value: false },
      { boolExp: "true", value: { k: "v" } }
    ]);
  });
});

describe("opiPatchRules", () => {
  it("renames rule.prop to json prop name and converts expression values when NOT an array pattern", () => {
    const parserDict: ParserDict = {
      "opi.number": ["number", (v: any) => Number(v)]
    };

    const widget: WidgetDescription = {
      rules: [
        {
          prop: "number",
          expressions: [{ value: "42" }, { value: "7" }]
        }
      ]
    } as Partial<WidgetDescription> as WidgetDescription;

    const result = opiPatchRules(parserDict)(widget);

    expect(result.rules?.[0].prop).toBe("opi.number");

    const exps = result.rules?.[0]?.expressions;
    expect(exps[0].convertedValue).toBe(42);
    expect(exps[1].convertedValue).toBe(7);
  });

  it("does NOT rename rule.prop if it matches an array pattern, but still converts values", () => {
    const parserDict: ParserDict = {
      "opi.flag": ["flag", (v: unknown) => v === "true" || v === true]
    };

    const widget: WidgetDescription = {
      rules: [
        {
          prop: "flag[0]",
          expressions: [{ value: "true" }, { value: "false" }]
        }
      ]
    } as Partial<WidgetDescription> as WidgetDescription;

    const result = opiPatchRules(parserDict)(widget);

    expect(result.rules?.[0].prop).toBe("flag[0]");

    const exps = result.rules?.[0]?.expressions;
    expect(exps[0].convertedValue).toBe(true);
    expect(exps[1].convertedValue).toBe(false);
  });

  it("skips rules whose props are not in the parser dict", () => {
    const parserDict: ParserDict = {
      "opi.count": ["count", (v: unknown) => Number(v)]
    };

    const widget: WidgetDescription = {
      rules: [
        {
          prop: "unknownProp",
          expressions: [{ value: "123" }]
        }
      ]
    } as Partial<WidgetDescription> as WidgetDescription;

    const result = opiPatchRules(parserDict)(widget);

    expect(result.rules?.[0].prop).toBe("unknownProp");
    expect(result.rules?.[0].expressions[0].convertedValue).toBeUndefined();
  });

  it("handles multiple rules and expressions with mixed cases", () => {
    const parserDict: ParserDict = {
      "opi.num": ["num", (v: unknown) => Number(v)],
      "opi.text": ["text", (v: unknown) => String(v).toUpperCase()]
    };

    const widget: WidgetDescription = {
      rules: [
        { prop: "num", expressions: [{ value: "5" }, { value: "10" }] }, // rename + convert
        { prop: "text[2]", expressions: [{ value: "hello" }] }, // array-like: no rename, convert
        { prop: "noMatch", expressions: [{ value: "x" }] } // untouched
      ]
    } as Partial<WidgetDescription> as WidgetDescription;

    const result = opiPatchRules(parserDict)(widget);

    expect(result.rules?.[0].prop).toBe("opi.num");
    expect(result.rules?.[0].expressions[0].convertedValue).toBe(5);
    expect(result.rules?.[0].expressions[1].convertedValue).toBe(10);

    expect(result.rules?.[1].prop).toBe("text[2]");
    expect(result.rules?.[1].expressions[0].convertedValue).toBe("HELLO");

    expect(result.rules?.[2].prop).toBe("noMatch");
    expect(result.rules?.[2].expressions[0].convertedValue).toBeUndefined();
  });

  it("returns the same widget when rules is undefined or empty", () => {
    const parserDict: ParserDict = {
      "opi.some": ["some", (v: any) => v]
    };

    const emptyRulesWidget: WidgetDescription = {
      rules: []
    } as Partial<WidgetDescription> as WidgetDescription;
    const noRulesWidget: WidgetDescription =
      {} as Partial<WidgetDescription> as WidgetDescription;

    const resultEmpty = opiPatchRules(parserDict)(emptyRulesWidget);
    const resultNone = opiPatchRules(parserDict)(noRulesWidget);

    expect(resultEmpty).toEqual(emptyRulesWidget);
    expect(resultNone).toEqual(noRulesWidget);
  });

  it("works when parserDict is null/undefined (no changes applied)", () => {
    const widget: WidgetDescription = {
      rules: [{ prop: "anything", expressions: [{ value: "x" }] }]
    } as Partial<WidgetDescription> as WidgetDescription;

    const result = opiPatchRules(
      undefined as unknown as ParserDict,
      {}
    )(widget);

    expect(result.rules?.[0].prop).toBe("anything");
    expect(result.rules?.[0].expressions[0].convertedValue).toBeUndefined();
  });

  it("re-indexes parserDict correctly: simpleProp -> [jsonProp, parser]", () => {
    const parserDict: ParserDict = {
      "opi.alpha": ["a", (v: unknown) => `A:${v}`],
      "opi.beta": ["b", (v: unknown) => `B:${v}`]
    };

    const widget: WidgetDescription = {
      rules: [
        { prop: "a", expressions: [{ value: 1 }] },
        { prop: "b", expressions: [{ value: 2 }] }
      ]
    } as Partial<WidgetDescription> as WidgetDescription;

    const result = opiPatchRules(parserDict, {})(widget);

    expect(result.rules?.[0].prop).toBe("opi.alpha");
    expect(result.rules?.[0].expressions[0].convertedValue).toBe("A:1");

    expect(result.rules?.[1].prop).toBe("opi.beta");
    expect(result.rules?.[1].expressions[0].convertedValue).toBe("B:2");
  });
});
