import { Color, ColorUtils } from "./color";

export interface Marker {
  color: Color;
  pvName: string;
  interactive: boolean;
  visible: boolean;
}

export type Markers = Marker[];

export const newMarker = (props: {
  color?: Color;
  pvName?: string;
  interactive?: boolean;
  visible?: boolean;
}): Marker => ({
  color: props.color ?? ColorUtils.fromRgba(0, 0, 255),
  pvName: props.pvName ?? "",
  interactive: props.interactive ?? false,
  visible: props.visible ?? true
});
