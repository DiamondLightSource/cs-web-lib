export type ResponsiveBreakpoints = Record<string, number>;
export type ResponsiveColumns = Record<string, number>;

export interface ResponsiveLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export type ResponsiveLayout = ResponsiveLayoutItem[];
export type ResponsiveGridLayout = Record<string, ResponsiveLayout>;
