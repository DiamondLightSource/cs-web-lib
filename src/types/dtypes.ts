export enum ChannelRole {
  RO,
  WO,
  RW
}

export enum DisplayForm {
  DEFAULT,
  STRING,
  BINARY,
  DECIMAL,
  HEX,
  EXPONENTIAL,
  ENGINEERING
}

export class DRange {
  public min: number;
  public max: number;
  public constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }
  public static NONE = new DRange(0, 0);
}

export class DDisplay {
  public description?: string;
  public role?: ChannelRole;
  public controlRange?: DRange;
  public alarmRange?: DRange;
  public warningRange?: DRange;
  public units?: string;
  public precision?: number;
  public form?: DisplayForm;
  public choices?: string[];

  public constructor({
    description = undefined,
    role = undefined,
    controlRange = undefined,
    alarmRange = undefined,
    warningRange = undefined,
    units = undefined,
    precision = undefined,
    form = undefined,
    choices = undefined
  }: {
    description?: string;
    role?: ChannelRole;
    controlRange?: DRange;
    alarmRange?: DRange;
    warningRange?: DRange;
    units?: string;
    precision?: number;
    form?: DisplayForm;
    choices?: string[];
  } = {}) {
    this.description = description;
    this.role = role;
    this.controlRange = controlRange;
    this.alarmRange = alarmRange;
    this.warningRange = warningRange;
    this.units = units;
    this.precision = precision;
    this.form = form;
    this.choices = choices;
  }

  public static NONE = new DDisplay({});
}

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

export function mergeDDisplay(
  original: DDisplay | undefined,
  update: DDisplay | undefined
): DDisplay {
  return new DDisplay({
    description: update?.description ?? original?.description,
    role: update?.role ?? original?.role,
    controlRange: update?.controlRange ?? original?.controlRange,
    alarmRange: update?.alarmRange ?? original?.alarmRange,
    warningRange: update?.warningRange ?? original?.warningRange,
    units: update?.units ?? original?.units,
    precision: update?.precision ?? original?.precision,
    form: update?.form ?? original?.form,
    choices: update?.choices ?? original?.choices
  });
}
