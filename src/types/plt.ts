import { Axes, newAxis } from "./axis";
import { Color, ColorUtils } from "./color";
import { Font, newFont } from "./font";
import { newTrace, Trace } from "./trace";

export interface Plt {
  title: string;
  axes: Axes;
  pvlist: Trace[];
  backgroundColor: Color;
  foregroundColor: Color;
  scroll: boolean;
  scrollStep: number;
  updatePeriod: number;
  bufferSize: number;
  start: string;
  end: string;
  showGrid: boolean;
  titleFont: Font;
  scaleFont: Font;
  labelFont: Font;
  legendFont: Font;
}

export const newPlt = (config: {
  title?: string;
  axes?: Axes;
  pvlist?: Trace[];
  background?: Color;
  foreground?: Color;
  scroll?: boolean;
  scrollStep?: number;
  updatePeriod?: number;
  bufferSize?: number;
  start?: string;
  end?: string;
  grid?: boolean;
  titleFont?: Font;
  scaleFont?: Font;
  labelFont?: Font;
  legendFont?: Font;
}): Plt => ({
  title: config.title ?? "",
  axes: config.axes ?? [newAxis({})],
  pvlist: config.pvlist ?? [newTrace({})],
  backgroundColor: config.background ?? ColorUtils.WHITE,
  foregroundColor: config.foreground ?? ColorUtils.BLACK,
  scroll: config.scroll ?? true,
  showGrid: config.grid ?? false,
  scrollStep: config.scrollStep ?? 5,
  updatePeriod: config.updatePeriod ?? 0,
  bufferSize: config.bufferSize ?? 5000,
  titleFont: config.titleFont ?? newFont(),
  labelFont: config.labelFont ?? newFont(),
  legendFont: config.legendFont ?? newFont(),
  scaleFont: config.scaleFont ?? newFont(),
  start: config.start ?? "1 minute",
  end: config.end ?? "now"
});
