import { Color } from "./color";
import { Font, FontStyle } from "./font";

export class Axis {
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
    color = new Color("rgb(0, 0, 0"),
    title = "",
    showGrid = false,
    visible = true,
    logScale = false,
    autoscale = false,
    minimum = 0,
    maximum = 100,
    titleFont = new Font(FontStyle.Bold),
    scaleFont = new Font(),
    onRight = false
  } = {}) {
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
    this.onRight = onRight;
  }
}

export type Axes = Axis[];
