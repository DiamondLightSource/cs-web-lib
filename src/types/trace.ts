import { Color } from "./color";

export class Trace {
  public name?: string;
  public axis?: number;
  public lineWidth?: number;
  public lineStyle?: number;
  public traceType?: number;
  public color?: Color;
  public pointType?: number;
  public pointSize?: number;
  public visible?: boolean;
  public xPv?: string | null;
  public yPv?: string;

  public constructor({
    name = "",
    axis = 0,
    lineWidth = 0,
    lineStyle = 0,
    traceType = 2,
    color = Color.fromRgba(0, 0, 255),
    pointType = 0,
    pointSize = 1,
    visible = true,
    xPv = "",
    yPv = ""
  } = {}) {
    // xPV property only exists on XYPlot
    if (xPv) this.xPv = xPv;
    this.yPv = yPv;
    this.axis = axis;
    this.name = name || (yPv ? yPv : "");
    this.lineWidth = lineWidth;
    this.lineStyle = lineStyle;
    this.traceType = traceType;
    this.color = color;
    this.pointType = pointType;
    this.pointSize = pointSize;
    this.visible = visible;
  }
}
