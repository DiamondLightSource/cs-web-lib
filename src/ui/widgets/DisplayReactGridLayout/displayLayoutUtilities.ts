import { Layout } from "react-grid-layout";
import { PVWidgetComponent } from "../widgetProps";

export const calculateDefaultLayout = (
  childrenArray: React.ReactElement<PVWidgetComponent>[],
  displayWidth: number | string,
  numberOfColumns: number,
  cellMargins: [number, number],
  cellHeight: number
): Layout => {
  const columnWidth =
    (toNumber(displayWidth, 1200) - cellMargins[0]) / numberOfColumns;

  return childrenArray.map((child, i) => {
    const { id, position = {} as any } = child.props;

    const height = toNumber(position?.height, 1);
    const width = toNumber(position?.width, 1);
    const x = toNumber(position?.x, 0);
    const y = toNumber(position?.y, 0);

    const widthColumns = width
      ? Math.max(1, Math.round(width / columnWidth))
      : 1;

    const heightRows = height
      ? Math.max(1, Math.round(height / (cellHeight + cellMargins[1])))
      : 1;

    const gridX = Math.max(0, Math.round(x / columnWidth));
    const gridY = Math.max(0, Math.round(y / (cellHeight + cellMargins[1])));

    return {
      i: id,
      x: gridX,
      y: gridY,
      w: widthColumns,
      h: heightRows
    };
  }) as Layout;
};

export const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    if (value.endsWith("%")) return fallback;

    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};
