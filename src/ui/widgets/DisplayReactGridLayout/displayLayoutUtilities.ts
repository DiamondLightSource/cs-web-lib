import {
  Layout,
  horizontalCompactor,
  verticalCompactor
} from "react-grid-layout";
import { PVWidgetComponent } from "../widgetProps";

export const calculateDefaultLayoutWithHorizontalCompactor = (
  childrenArray: React.ReactElement<PVWidgetComponent>[],
  displayWidth: number | string,
  numberOfColumns: number,
  cellMargins: [number, number],
  cellHeight: number
): Layout => {
  const layout = calculateDefaultLayout(
    childrenArray,
    displayWidth,
    numberOfColumns,
    cellMargins,
    cellHeight
  );

  // vertical compactor will fill empty area to the left of screen
  return horizontalCompactor.compact(layout, numberOfColumns);
};

export const calculateDefaultLayout = (
  childrenArray: React.ReactElement<PVWidgetComponent>[],
  displayWidth: string | number,
  numberOfColumns: number,
  cellMargins: [number, number],
  cellHeight: number
) => {
  const columnWidth =
    (toNumber(displayWidth, 1200) - cellMargins[0]) / numberOfColumns;

  //
  const layout = childrenArray.map((child, i) => {
    const { id, position = {} as any } = child.props;

    const height = toNumber(position?.height, 1);
    const width = toNumber(position?.width, 1);
    const x = toNumber(position?.x, 0);
    const y = toNumber(position?.y, 0);

    const widthColumns = width
      ? Math.max(1, Math.ceil(width / columnWidth))
      : 1;

    const heightRows = height
      ? Math.max(1, Math.round(height / (cellHeight + cellMargins[1])))
      : 1;

    let gridX = Math.max(0, Math.round(x / columnWidth)) % numberOfColumns;
    if (gridX + widthColumns > columnWidth) {
      gridX = 0;
    }
    const gridY = Math.max(0, Math.floor(y / (cellHeight + cellMargins[1])));

    return {
      i: id,
      x: gridX,
      y: gridY,
      w: widthColumns,
      h: heightRows
    };
  }) as Layout;

  // vertical compactor will position the elements in a column structure
  return verticalCompactor.compact(layout, numberOfColumns);
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

export const sameKeys = (a: object, b: object) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  return (
    keysA.length === keysB.length &&
    new Set(keysA).size === new Set(keysB).size &&
    [...new Set(keysA)].every(item => keysB.includes(item))
  );
};
