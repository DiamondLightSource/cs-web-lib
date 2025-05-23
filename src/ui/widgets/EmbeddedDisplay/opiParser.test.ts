import log from "loglevel";
import { Color } from "../../../types/color";
import { Border } from "../../../types/border";
import { Rule } from "../../../types/props";
import { parseOpi } from "./opiParser";
import { AbsolutePosition, RelativePosition } from "../../../types/position";
import { ensureWidgetsRegistered } from "..";
import { WidgetDescription } from "../createComponent";
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
  it("parses a display widget", (): void => {
    const displayWidget = parseOpi(displayString, "ca", PREFIX);
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

  it("parses a label widget", (): void => {
    const widget = parseOpi(labelString, "ca", PREFIX)
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

  it("parses a widget with a rule", (): void => {
    const widget = parseOpi(ruleString, "ca", PREFIX)
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

  it("parses a widget with a child widget", (): void => {
    const widget = parseOpi(childString, "ca", PREFIX)
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

  it("parses a widget with an action", (): void => {
    const widget = parseOpi(actionString, "ca", PREFIX)
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

  it("parses an input widget", (): void => {
    const widget = parseOpi(inputString, "ca", PREFIX)
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
  it("doesn't parse an invalid string", (): void => {
    // Reduce logging when expecting error.
    log.setLevel("error");
    const widget = parseOpi(invalidString, "ca", PREFIX)
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
  it("doesn't parse an invalid bool", (): void => {
    // Reduce logging when expecting error.
    log.setLevel("error");
    const widget = parseOpi(invalidBool, "ca", PREFIX)
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
  it("parses xygraph widget", (): void => {
    const widget = parseOpi(xygraphString, "ca", PREFIX)
      .children?.[0] as WidgetDescription;
    expect(widget.traces.count).toEqual(1);
    expect(widget.axes.count).toEqual(3);
    expect(widget.traces.traceOptions[0].bufferSize).toEqual(65536);
    expect(widget.axes.axisOptions[2].leftBottomSide).toEqual(false);
  });
});
