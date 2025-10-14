import { Color } from "./color";

export interface Archiver {
  name: string;
  url: string;
}

export class Trace {
  public name: string;
  public axis: number;
  public lineWidth: number;
  public lineStyle: number;
  public traceType: number;
  public color: Color;
  public pointType: number;
  public pointSize: number;
  public visible: boolean;
  public yPv: string;
  public xPv?: string | null;
  public bufferSize?: number;
  public plotMode?: number;
  public antiAlias?: boolean;
  public concatenateData?: boolean;
  public updateDelay?: number;
  public updateMode?: number;
  public archive?: Archiver | undefined;

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
    yPv = "",
    fromOpi = false,
    antiAlias = true,
    bufferSize = 100,
    concatenateData = true,
    updateDelay = 100,
    updateMode = 0,
    plotMode = 0,
    archive = undefined
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
    if (archive) this.archive = archive;
    if (fromOpi) {
      this.antiAlias = antiAlias;
      this.bufferSize = bufferSize;
      this.concatenateData = concatenateData;
      this.updateDelay = updateDelay;
      this.updateMode = updateMode;
      this.plotMode = plotMode;
    }
  }
}
