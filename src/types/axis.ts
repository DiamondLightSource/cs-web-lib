import { Color, newColor } from "./color";
import { Font, FontStyle } from "./font";

export class Axis {
  public xAxis: boolean;
  public color: Color;
  public title: string;
  public showGrid: boolean;
  public visible: boolean;
  public logScale: boolean;
  public autoscale: boolean;
  public maximum: number;
  public minimum: number;
  public titleFont: Font;
  public scaleFont: Font;
  public onRight: boolean;

  /**
   * Set default values for properties not yet
   * set, otherwise use set property. Uses same
   * default values as csstudio.opibuilder.xygraph.
   */
  public constructor({
    xAxis = false,
    color = newColor("rgb(0, 0, 0)"),
    title = "",
    showGrid = false,
    visible = true,
    logScale = false,
    autoscale = false,
    minimum = 0,
    maximum = 100,
    titleFont = new Font(14, FontStyle.Bold),
    scaleFont = new Font(12, FontStyle.Regular),
    onRight = false,
    fromOpi = false
  } = {}) {
    this.xAxis = xAxis;
    this.color = color;
    this.title = title || (xAxis ? "X" : "Y");
    this.showGrid = showGrid;
    this.visible = visible;
    this.logScale = logScale;
    this.autoscale = autoscale;
    this.minimum = minimum;
    this.maximum = maximum;
    this.titleFont = titleFont;
    this.scaleFont = scaleFont;
    this.onRight = fromOpi ? !onRight : onRight;
  }
}

export type Axes = Axis[];
