import { Color } from "./color";
import { Font, FontStyle } from "./font";

export class Axis {
  public index: number;
  public autoScale?: boolean;
  public autoScaleThreshold?: number;
  public axisColor?: Color;
  public axisTitle?: string;
  public showGrid?: boolean;
  public gridColor?: Color;
  public dashGridLine?: boolean;
  public timeFormat?: number;
  public scaleFormat?: string;
  public scaleFont?: Font;
  public titleFont?: Font;
  public visible?: boolean;
  public logScale?: boolean;
  public leftBottomSide?: boolean;
  public maximum?: number;
  public minimum?: number;
  public yAxis?: boolean;

  /**
   * Set default values for properties not yet
   * set, otherwise use set property. Uses same
   * default values as csstudio.opibuilder.xygraph.
   */
  public constructor(idx: number) {
    this.index = idx;
    this.autoScale = true;
    this.autoScaleThreshold = 0.95;
    this.axisColor = new Color("rgb(0, 0, 0");
    this.axisTitle = "";
    this.showGrid = false;
    this.gridColor = new Color("rgb(0, 0, 0");
    this.dashGridLine = true;
    this.timeFormat = 0;
    this.scaleFormat = "";
    this.scaleFont = new Font();
    this.titleFont = new Font(10, FontStyle.Bold);
    this.visible = true;
    this.logScale = false;
    this.leftBottomSide = true;
    this.minimum = 0;
    this.maximum = 100;
    // If axis has index 1 or above, assume y axis
    this.index > 0 ? (this.yAxis = true) : (this.yAxis = false);
  }
}

export class Axes {
  public count: number;
  public axisOptions: Axis[];

  public constructor(count: number, axes: Axis[]) {
    if (count !== axes.length) {
      throw new Error(
        `Count ${count} is not equal to number of axes ${axes.length}`
      );
    }
    this.count = count;
    this.axisOptions = axes;
  }
}
