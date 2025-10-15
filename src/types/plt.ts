import { Axes, Axis } from "./axis";
import { Color } from "./color";
import { Font } from "./font";
import { Trace } from "./trace";

export class Plt {
  public title: string;
  public axes: Axes;
  public pvlist: Trace[];
  public backgroundColor: Color;
  public foregroundColor: Color;
  public scroll: boolean;
  public scrollStep: number;
  public updatePeriod: number;
  public start: string;
  public end: string;
  public showGrid: boolean;
  public titleFont: Font;
  public scaleFont: Font;
  public labelFont: Font;
  public legendFont: Font;

  /**
   * Set default values for properties not yet
   * set, otherwise use set property.
   */
  public constructor({
    title = "",
    axes = [new Axis()],
    pvlist = [new Trace()],
    background = Color.WHITE,
    foreground = Color.BLACK,
    scroll = true,
    grid = false,
    scrollStep = 5,
    updatePeriod = 1,
    titleFont = new Font(),
    labelFont = new Font(),
    legendFont = new Font(),
    scaleFont = new Font(),
    start = "1 minute",
    end = "now"
  } = {}) {
    this.backgroundColor = background;
    this.foregroundColor = foreground;
    this.title = title;
    this.scroll = scroll;
    this.scrollStep = scrollStep;
    this.axes = axes;
    this.pvlist = pvlist;
    this.updatePeriod = updatePeriod;
    this.showGrid = grid;
    this.start = start;
    this.end = end;
    this.titleFont = titleFont;
    this.scaleFont = scaleFont;
    this.labelFont = labelFont;
    this.legendFont = legendFont;
  }
}
