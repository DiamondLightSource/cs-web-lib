import { Color, ColorUtils } from "./color";

export interface Archiver {
  name: string;
  url: string;
}

export interface Trace {
  name: string;
  axis: number;
  lineWidth: number;
  lineStyle: number;
  traceType: number;
  color: Color;
  pointType: number;
  pointSize: number;
  visible: boolean;
  yPv: string;
  xPv?: string | null;
  bufferSize?: number;
  plotMode?: number;
  antiAlias?: boolean;
  concatenateData?: boolean;
  updateDelay?: number;
  updateMode?: number;
  archive?: Archiver | undefined;
}

/**
 * Set default values for properties not yet
 * set, otherwise use set property. Uses same
 * default values as csstudio.opibuilder.xygraph.
 */
export const newTrace = (config: {
  name?: string;
  axis?: number;
  lineWidth?: number;
  lineStyle?: number;
  traceType?: number;
  color?: Color;
  pointType?: number;
  pointSize?: number;
  visible?: boolean;
  yPv?: string;
  xPv?: string | null;
  bufferSize?: number;
  plotMode?: number;
  antiAlias?: boolean;
  concatenateData?: boolean;
  updateDelay?: number;
  updateMode?: number;
  archive?: Archiver | undefined;
  fromOpi?: boolean;
}): Trace => ({
  name: config.name || (config.yPv ? config.yPv : ""),
  axis: config.axis ?? 0,
  lineWidth: config.lineWidth ?? 0,
  lineStyle: config.lineStyle ?? 0,
  traceType: config.traceType ?? 2,
  archive: config.archive ?? { name: "", url: "" },
  color: config.color ?? ColorUtils.fromRgba(0, 0, 255),
  pointType: config.pointType ?? 0,
  pointSize: config.pointSize ?? 1,
  visible: config.visible ?? true,
  ...(config.xPv && { xPv: config.xPv ?? "" }),
  yPv: config.yPv ?? "",
  // Legacy opi props
  ...(config.fromOpi && {
    antiAlias: config.antiAlias ?? true,
    bufferSize: config.bufferSize ?? 100,
    concatenateData: config.concatenateData ?? true,
    updateDelay: config.updateDelay ?? 100,
    updateMode: config.updateMode ?? 0,
    plotMode: config.plotMode ?? 0
  })
});
