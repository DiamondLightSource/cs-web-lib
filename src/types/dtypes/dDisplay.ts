import { DRange } from "./dRange";

enum ChannelRole {
  RO,
  WO,
  RW
}

enum DisplayForm {
  DEFAULT,
  STRING,
  BINARY,
  DECIMAL,
  HEX,
  EXPONENTIAL,
  ENGINEERING
}

export interface DDisplay {
  description?: string;
  role?: ChannelRole;
  controlRange?: DRange;
  alarmRange?: DRange;
  warningRange?: DRange;
  units?: string;
  precision?: number;
  form?: DisplayForm;
  choices?: string[];
}

export const newDDisplay = ({
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
} = {}): DDisplay => ({
  description,
  role,
  controlRange,
  alarmRange,
  warningRange,
  units,
  precision,
  form,
  choices
});

export function mergeDDisplay(
  original: DDisplay | undefined,
  update: DDisplay | undefined
): DDisplay {
  return newDDisplay({
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

export const dDisplayNONE = newDDisplay({});
