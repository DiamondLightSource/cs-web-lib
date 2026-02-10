import { REGISTERED_WIDGETS } from "../register";
import { Rule } from "../../../types/props";
import { Font, FontStyle, newFont } from "../../../types/font";
import { Color, newColor } from "../../../types/color";
import { parseWidget, ParserDict, ComplexParserDict } from "./parser";
import { Border, BorderStyle, newBorder } from "../../../types/border";
import {
  Position,
  newAbsolutePosition,
  newRelativePosition
} from "../../../types/position";
import { PV, PVUtils } from "../../../types/pv";
import { WidgetDescription } from "../createComponent";

interface JsonBorder {
  style: string;
  color: string;
  width: number;
  radius?: number;
}

interface JsonFont {
  typeface: string;
  size: number;
  style?: string;
  name?: string;
}

function jsonParsePvName(pvName: string, defaultProtocol: string): PV {
  return PVUtils.parse(pvName, defaultProtocol);
}

const toString = (value: undefined | string | number): string =>
  value != null ? `${value}` : "";

function jsonParsePosition(props: Record<string, string>): Position {
  if (props.position === "absolute") {
    return newAbsolutePosition(
      toString(props.x),
      toString(props.y),
      toString(props.width),
      toString(props.height),
      toString(props.margin),
      toString(props.padding),
      toString(props.minWidth),
      toString(props.maxWidth),
      toString(props.minHeight)
    );
  } else {
    return newRelativePosition(
      toString(props.x),
      toString(props.y),
      toString(props.width),
      toString(props.height),
      toString(props.margin),
      toString(props.padding),
      toString(props.minWidth),
      toString(props.maxWidth),
      toString(props.minHeight)
    );
  }
}

function jsonParseColor(jsonColor: string | { colorString: string }): Color {
  return typeof jsonColor === "string" || jsonColor instanceof String
    ? newColor(jsonColor as string)
    : newColor(jsonColor.colorString);
}

function jsonParseBorder(jsonBorder: JsonBorder): Border {
  const styles: { [key: string]: BorderStyle } = {
    none: BorderStyle.None,
    line: BorderStyle.Line,
    dashed: BorderStyle.Dashed,
    dotted: BorderStyle.Dotted,
    groupbox: BorderStyle.GroupBox
  };
  return newBorder(
    styles[jsonBorder.style.toLowerCase()],
    jsonParseColor(jsonBorder.color),
    jsonBorder.width,
    jsonBorder.radius
  );
}

function jsonParseFont(jsonFont: JsonFont): Font {
  const styles: { [key: string]: FontStyle } = {
    italic: FontStyle.Italic,
    bold: FontStyle.Bold,
    "bold italic": FontStyle.BoldItalic
  };
  return newFont(
    jsonFont.size,
    jsonFont.style ? styles[jsonFont.style] : undefined,
    jsonFont.typeface
  );
}

function jsonParseRules(jsonRules: Rule[], defaultProtocol: string): Rule[] {
  for (const jsonRule of jsonRules) {
    for (const pv of jsonRule.pvs) {
      pv.pvName = jsonParsePvName(
        // Typing: allow pvName to be a string so that we can use the same type
        // (Rule) for the unparsed as the parsed rule.
        pv.pvName as unknown as string,
        defaultProtocol
      );
    }
    for (const exp of jsonRule.expressions) {
      if (SIMPLE_PARSERS.hasOwnProperty(jsonRule.prop)) {
        exp.convertedValue = SIMPLE_PARSERS[jsonRule.prop][1](exp.value);
      } else {
        exp.convertedValue = exp.value;
      }
    }
  }
  return jsonRules;
}

export const SIMPLE_PARSERS: ParserDict = {
  backgroundColor: ["backgroundColor", jsonParseColor],
  foregroundColor: ["foregroundColor", jsonParseColor],
  font: ["font", jsonParseFont],
  border: ["border", jsonParseBorder]
};

export const COMPLEX_PARSERS: ComplexParserDict = {
  position: jsonParsePosition
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function jsonGetTargetWidget(props: any): {
  widget: React.FC;
  widgetProps: any;
} {
  const typeid = props.type;
  const targetWidget =
    REGISTERED_WIDGETS[typeid] ?? REGISTERED_WIDGETS["shape"];
  return { widget: targetWidget[0], widgetProps: targetWidget[1] };
}

/**
 * Parse a WidgetDescription from objects, typically parsed from JSON.
 * @param jsonString objects in the correct format.
 * @param defaultProtocol default protocol to use for PVs.
 */
export async function parseObject(
  object: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  defaultProtocol: string,
  path?: string
): Promise<WidgetDescription> {
  const simpleParsers: ParserDict = {
    ...SIMPLE_PARSERS,
    pvName: [
      "pvName",
      (pvName: string): PV => jsonParsePvName(pvName, defaultProtocol)
    ],
    rules: [
      "rules",
      (rules: Rule[]): Rule[] => jsonParseRules(rules, defaultProtocol)
    ]
  };
  return await parseWidget(
    object,
    jsonGetTargetWidget,
    "children",
    simpleParsers,
    COMPLEX_PARSERS,
    true,
    [],
    path
  );
}

/**
 * Parse a WidgetDescription from a JSON string.
 * @param jsonString JSON string in the correct format.
 * @param defaultProtocol default protocol to use for PVs.
 */
export async function parseJson(
  jsonString: string,
  defaultProtocol: string,
  path: string
): Promise<WidgetDescription> {
  return await parseObject(JSON.parse(jsonString), defaultProtocol, path);
}
