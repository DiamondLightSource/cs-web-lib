import { Color, newColor } from "./color";
import { Font, FontStyle, newFont } from "./font";

export interface Axis {
  xAxis: boolean;
  color: Color;
  title: string;
  showGrid: boolean;
  visible: boolean;
  logScale: boolean;
  autoscale: boolean;
  maximum: number;
  minimum: number;
  titleFont: Font;
  scaleFont: Font;
  onRight: boolean;
}

/**
 * Set default values for properties not yet
 * set, otherwise use set property. Uses same
 * default values as csstudio.opibuilder.xygraph.
 */
export const newAxis = (config: {
  xAxis?: boolean;
  color?: Color;
  title?: string;
  showGrid?: boolean;
  visible?: boolean;
  logScale?: boolean;
  autoscale?: boolean;
  maximum?: number;
  minimum?: number;
  titleFont?: Font;
  scaleFont?: Font;
  onRight?: boolean;
  fromOpi?: boolean;
}): Axis => ({
  xAxis: config.xAxis ?? false,
  color: config.color ?? newColor("rgb(0, 0, 0)"),
  title: config.title ?? (config.xAxis ? "X" : "Y"),
  showGrid: config.showGrid ?? false,
  visible: config.visible ?? true,
  logScale: config.logScale ?? false,
  autoscale: config.autoscale ?? false,
  minimum: config.minimum ?? 0,
  maximum: config.maximum ?? 100,
  titleFont: config.titleFont ?? newFont(14, FontStyle.Bold),
  scaleFont: config.scaleFont ?? newFont(12, FontStyle.Regular),
  onRight: config.fromOpi ? !config.onRight : (config.onRight ?? false)
});

export type Axes = Axis[];
