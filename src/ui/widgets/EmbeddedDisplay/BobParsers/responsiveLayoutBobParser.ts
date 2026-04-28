import { ElementCompact } from "xml-js";
import log from "loglevel";
import {
  ResponsiveBreakpoints,
  ResponsiveColumns,
  ResponsiveGridLayout,
  ResponsiveLayout,
  ResponsiveLayoutItem
} from "../../../../types/responsiveBreakpoints";
import { opiParseString } from "../opiParser";
import { bobParseNumber } from "./baseBobParsers";

export const bobParseStringNumberMap = (
  jsonProp: ElementCompact
): ResponsiveBreakpoints =>
  Object.fromEntries(
    Object.entries(jsonProp)
      .map(([key, value]) => [key, bobParseNumber(value)])
      .filter(x => x[1] != null)
  );

export const bobParseResponsiveBreakpoints = (
  jsonProp: ElementCompact
): ResponsiveBreakpoints => bobParseStringNumberMap(jsonProp);

export const bobParseResponsiveMargins = (
  jsonProp: ElementCompact
): [number, number] => {
  const spaceSeparatedArray = opiParseString(jsonProp);

  const margins = spaceSeparatedArray?.trim()?.split(/\s+/)?.map(Number);

  if (margins.some(v => !Number.isFinite(Number(v)))) {
    log.error(
      "Invalid number in space separated number array: ",
      spaceSeparatedArray
    );
    return [6, 6];
  }

  return [margins[0] ?? 6, margins[1] ?? 6];
};

export const bobParseResponsiveColumns = (
  jsonProp: ElementCompact
): ResponsiveColumns => bobParseStringNumberMap(jsonProp);

export const bobParseResponsiveLayout = (
  jsonProp: ElementCompact
): ResponsiveGridLayout => {
  try {
    return Object.fromEntries(
      Object.entries(jsonProp)
        .map(([key, value]) => [key, bobParseResponsiveComponentLayouts(value)])
        .filter(x => x[1] != null)
    );
  } catch (error) {
    log.error("bobParser: Failed to parse a responsive layout");
    log.error(error);
    return {};
  }
};

const bobParseResponsiveComponentLayouts = (
  jsonProp: ElementCompact
): ResponsiveLayout => {
  if (!jsonProp?.element_position || jsonProp?.element_position?.length === 0) {
    return [];
  }

  return jsonProp.element_position
    .filter((element: ElementCompact) => !!element?._attributes)
    .map((element: ElementCompact) =>
      bobParseResponsiveItem(element._attributes as ElementCompact)
    );
};

const bobParseResponsiveItem = (
  jsonProp: ElementCompact
): ResponsiveLayoutItem => ({
  i: jsonProp?.i,
  x: Number(jsonProp?.x),
  y: Number(jsonProp?.y),
  w: Number(jsonProp?.w),
  h: Number(jsonProp?.h)
});
