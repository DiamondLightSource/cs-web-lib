export interface Point {
  x: number;
  y: number;
}

export interface Points {
  values: Array<Point>;
}

export const newPoint = (x: number, y: number): Point => ({ x, y });
export const newPoints = (values: Array<Point>): Points => ({ values });
