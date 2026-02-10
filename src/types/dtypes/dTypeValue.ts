export type NumberArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array
  | Float32Array
  | Float64Array;

export interface DTypeValue {
  stringValue?: string;
  doubleValue?: number;
  arrayValue?: NumberArray;
  stringArray?: string[];
}
