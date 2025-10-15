import { PvDatum } from "../../redux/csState";
import { AlarmQuality, DType } from "../../types/dtypes";
import { getPvValueAndName } from "./utils";

function tooltipValue(connected?: boolean, value?: DType): string {
  if (value) {
    const time = value.getTime();
    const alarm = value.getAlarm();
    let displayValue = "";
    if (!connected) {
      displayValue = "WARNING: Not Connected";
    } else {
      if (!value) {
        displayValue = "Warning: Waiting for value";
      } else {
        displayValue = DType.coerceString(value);
        if (alarm.quality !== AlarmQuality.VALID) {
          displayValue += ` [${alarm.quality}]`;
        }
      }
    }
    const dateAndAlarm = [
      value ? (time ? time.datetime : "") : "",
      value ? (alarm ? alarm.message : "") : ""
    ]
      .filter((word): boolean => word !== "")
      .join(", ");
    return `${displayValue}\n ${dateAndAlarm}`;
  } else {
    return "no value";
  }
}

export function resolveTooltip(props: {
  pvData: PvDatum[];
  tooltip: string;
}): string | undefined {
  const pvValueRegex = /\${pvValue}|\${pv_value}/g;
  const { pvData, tooltip } = props;

  const { value, connected } = getPvValueAndName(pvData);

  if (tooltip.match(pvValueRegex)) {
    const ttval = tooltipValue(connected, value);
    return tooltip.replace(pvValueRegex, ttval);
  } else {
    return tooltip;
  }
}
