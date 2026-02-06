export enum AlarmQuality {
  VALID = "valid",
  WARNING = "warning",
  ALARM = "alarm",
  INVALID = "invalid",
  UNDEFINED = "undefined",
  CHANGING = "changing"
}

export interface DAlarm {
  quality: AlarmQuality;
  message: string;
}

export const newDAlarm = (quality: AlarmQuality, message: string): DAlarm => ({
  quality,
  message
});

export const DAlarmNONE = (): DAlarm => newDAlarm(AlarmQuality.VALID, "");
export const DAlarmMINOR = (): DAlarm => newDAlarm(AlarmQuality.WARNING, "");
export const DAlarmMAJOR = (): DAlarm => newDAlarm(AlarmQuality.ALARM, "");
