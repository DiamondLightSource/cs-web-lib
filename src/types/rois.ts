import { Color, ColorUtils } from ".";

export interface Roi {
  name: string;
  color: Color;
  visible: boolean;
  interactive: boolean;
  xPv?: string;
  yPv?: string;
  heightPv?: string;
  widthPv?: string;
  file?: string;
}

export const newRoi = (config: {
  name?: string;
  color?: Color;
  visible?: boolean;
  interactive?: boolean;
  xPv?: string;
  yPv?: string;
  heightPv?: string;
  widthPv?: string;
  file?: string;
}): Roi => ({
  name: config.name ?? "",
  color: config.color ?? ColorUtils.RED,
  visible: config.visible ?? true,
  interactive: config.interactive ?? true,
  xPv: config.xPv,
  yPv: config.yPv,
  widthPv: config.widthPv,
  heightPv: config.heightPv,
  file: config.file
});

export type Rois = Roi[];
