export class Point {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Points {
  public values: Array<Point>;

  public constructor(values: Array<Point>) {
    this.values = values;
  }
}
