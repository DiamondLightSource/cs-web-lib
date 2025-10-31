import { Color } from "../../../types/color";
import { AbsolutePosition } from "../../../types/position";
import { parseBob } from "./bobParser";
import { PV } from "../../../types/pv";
import { ensureWidgetsRegistered } from "..";
import { WidgetDescription } from "../createComponent";
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
      new AbsolutePosition("10px", "20px", "550px", "31px")
    );
    // Color type
    expect(widget.foregroundColor).toEqual(Color.RED);
    // Unrecognised property not passed on.
    expect(widget.not_a_property).toEqual(undefined);
    expect(widget.wrapWords).toEqual(false);
    expect(widget.transparent).toEqual(true);
    expect(widget.rotationStep).toEqual(1);
  });

  const readbackString = `
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
    </widget>
  </display>`;
  it("parses a readback widget", async (): Promise<void> => {
    const widget = (await parseBob(readbackString, "xxx", PREFIX))
      .children?.[0] as WidgetDescription;
    expect(widget.pvMetadataList[0].pvName).toEqual(PV.parse("xxx://abc"));
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
