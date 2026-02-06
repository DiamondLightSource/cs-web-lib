export interface DRange {
  min: number;
  max: number;
}

export const newDRange = (min: number, max: number): DRange => ({ min, max });
