import { vi } from "vitest";
import { parsePlt } from "./pltParser";
import { ColorUtils } from "../../../types/color";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Global {}
  }
}

interface GlobalFetch extends NodeJS.Global {
  fetch: any;
}
const globalWithFetch = global as GlobalFetch;

describe("plt parser", (): void => {
  const displayString = `<?xml version="1.0" encoding="UTF-8"?>
<databrowser>
  <title></title>
  <show_toolbar>true</show_toolbar>
  <update_period>3.0</update_period>
  <scroll_step>5</scroll_step>
  <scroll>false</scroll>
  <start>2025-09-29 09:45:36.000</start>
  <end>2025-10-14 09:45:57.000</end>
  <archive_rescale>STAGGER</archive_rescale>
  <foreground>
    <red>51</red>
    <green>77</green>
    <blue>179</blue>
  </foreground>
  <background>
    <red>204</red>
    <green>204</green>
    <blue>204</blue>
  </background>
  <title_font>Liberation Sans|20|1</title_font>
  <label_font>Liberation Sans|14|1</label_font>
  <scale_font>Liberation Sans|12|0</scale_font>
  <legend_font>Liberation Sans|14|0</legend_font>
  <axes>
    <axis>
      <visible>true</visible>
      <name>Value 2</name>
      <use_axis_name>false</use_axis_name>
      <use_trace_names>true</use_trace_names>
      <right>false</right>
      <color>
        <red>0</red>
        <green>0</green>
        <blue>0</blue>
      </color>
      <min>-31.0</min>
      <max>330.0</max>
      <grid>false</grid>
      <autoscale>false</autoscale>
      <log_scale>false</log_scale>
    </axis>
  </axes>
  <annotations>
  </annotations>
  <pvlist>
    <pv>
      <display_name>TEST:PV</display_name>
      <visible>true</visible>
      <name>TEST:PV</name>
      <axis>0</axis>
      <color>
        <red>0</red>
        <green>255</green>
        <blue>0</blue>
      </color>
      <trace_type>AREA</trace_type>
      <linewidth>2</linewidth>
      <line_style>SOLID</line_style>
      <point_type>NONE</point_type>
      <point_size>2</point_size>
      <waveform_index>0</waveform_index>
      <period>0.0</period>
      <ring_size>5000</ring_size>
      <request>OPTIMIZED</request>
      <archive>
        <name>Primary Test</name>
        <url>pbraw://test.diamond.ac.uk/retrieval</url>
        <key>1</key>
      </archive>
    </pv>
  </pvlist>
</databrowser>`;
  it("parses a plt file", async (): Promise<void> => {
    const mockSuccessResponse: any = displayString;
    const mockPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
      text: (): Promise<unknown> => mockPromise
    });
    const mockFetch = (): Promise<unknown> => mockFetchPromise;
    vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);
    const plt = await parsePlt(
      { _text: "fakefile.plt" },
      "fakeDir",
      "databrowser"
    );
    expect(plt.backgroundColor.colorString).toEqual(
      ColorUtils.fromRgba(204, 204, 204).colorString
    );
    // Check custom props parsed correctly
    expect(plt.axes.length).toEqual(1);
    expect(plt.pvlist[0].archive).toEqual({
      name: "Primary Test",
      url: "https://test.diamond.ac.uk/retrieval"
    });
  });
});
