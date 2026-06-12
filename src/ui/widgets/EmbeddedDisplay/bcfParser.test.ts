import { ensureWidgetsRegistered } from "..";
import { WidgetDescription } from "../createComponent";
import { parseBcf } from "./bcfParser";
ensureWidgetsRegistered();

const PREFIX = "prefix";

describe("bcf file parser", (): void => {
  const bcfFileString = `
  <?xml version="1.0" encoding="UTF-8"?>
    <display version="2.0.0">
    <name>Widget Classes</name>
    <y use_class="true">0</y>
    <widget type="bool_button" version="2.0.0">
        <name>DLS_PRIMARY</name>
        <x>30</x>
        <y>133</y>
        <width>184</width>
        <height>40</height>
        <off_label>Primary button</off_label>
        <off_color use_class="true">
        <color red="237" green="237" blue="237">
        </color>
        </off_color>
        <on_color use_class="true">
        <color red="56" green="206" blue="56">
        </color>
        </on_color>
        <font use_class="true">
        <font family="Arial" style="REGULAR" size="14.0">
        </font>
        </font>
        <foreground_color use_class="true">
        <color red="255" green="255" blue="255">
        </color>
        </foreground_color>
        <background_color use_class="true">
        <color red="29" green="41" blue="69">
        </color>
        </background_color>
    </widget>
    <widget type="action_button" version="3.0.0">
        <name>MY_CLASS</name>
        <x>390</x>
        <y>180</y>
        <foreground_color use_class="true">
        <color name="Text" red="0" green="0" blue="0">
        </color>
        </foreground_color>
        <background_color use_class="true">
        <color name="STOP" red="0" green="0" blue="255">
        </color>
        </background_color>
        <tooltip>$(actions)</tooltip>
    </widget>
    </display>`;

  it("parses only class properties", async (): Promise<void> => {
    const classes = (await parseBcf(
      bcfFileString,
      "ca",
      PREFIX
    )) as WidgetDescription;
    expect(classes.children?.length).toEqual(2);

    const label = classes.children?.[0] as WidgetDescription;
    expect(label.name).toEqual("DLS_PRIMARY");
    // Colours survive as use class
    expect(label.backgroundColor).toEqual({
      colorString: "rgba(29,41,69,1)"
    });
    // Non class property not passed on
    expect(label.offLabel).toEqual(undefined);

    const actionButton = classes.children?.[1] as WidgetDescription;
    expect(actionButton.name).toEqual("MY_CLASS");
    // Colours survive as use class
    expect(actionButton.backgroundColor).toEqual({
      colorString: "rgba(0,0,255,1)"
    });

    // Non class property not passed on
    expect(actionButton.width).toEqual(undefined);
  });
});
