import { ElementCompact } from "xml-js";

export function bobParseNumber(jsonProp: ElementCompact): number | undefined {
  try {
    return Number(jsonProp._text);
  } catch {
    return undefined;
  }
}

export function bobParseNumberMandatory(jsonProp: ElementCompact): number {
  let rawValue: any;

  try {
    rawValue = jsonProp._text;
    return Number(jsonProp._text);
  } catch {
    throw new Error(`Could not parse number from value ${rawValue}.`);
  }
}
