import { REGISTERED_WIDGETS } from "../register";
import { ComplexParserDict, parseWidget, ParserDict, toArray } from "./parser";
import {
  XmlDescription,
  OPI_COMPLEX_PARSERS,
  OPI_SIMPLE_PARSERS,
  OPI_PATCHERS,
  opiParseRules,
  opiParsePvName,
  opiParseColor,
  opiParseString,
  opiParseMacros,
  opiParseBoolean
} from "./opiParser";
import { xml2js, ElementCompact } from "xml-js";
import log from "loglevel";
import {
  Position,
  AbsolutePosition,
  RelativePosition
} from "../../../types/position";
import { PV } from "../../../types/pv";
import { OpiFile, Rule } from "../../../types/props";
import {
  OPEN_PAGE,
  OPEN_TAB,
  OPEN_WEBPAGE,
  WidgetActions,
  WRITE_PV
} from "../widgetActions";
import { Font, FontStyle } from "../../../types/font";
import { Border, BorderStyle } from "../../../types/border";
import { Color } from "../../../types/color";
import { WidgetDescription } from "../createComponent";
import { Point, Points } from "../../../types/points";

const BOB_WIDGET_MAPPING: { [key: string]: any } = {
  action_button: "actionbutton",
  arc: "arc",
  bool_button: "boolbutton",
  byte_monitor: "bytemonitor",
  checkbox: "checkbox",
  combo: "menubutton",
  display: "display",
  ellipse: "ellipse",
  embedded: "embeddedDisplay",
  group: "groupbox",
  label: "label",
  led: "led",
  textupdate: "readback",
  textentry: "input",
  picture: "image",
  polygon: "polygon",
  polyline: "line",
  progressbar: "progressbar",
  rectangle: "shape",
  choice: "choicebutton",
  scaledslider: "slidecontrol",
  symbol: "symbol"
};

// Default width and height of widgets in Phoebus
export const WIDGET_DEFAULT_SIZES: { [key: string]: [number, number] } = {
  action_button: [100, 30],
  arc: [100, 100],
  bool_button: [100, 30],
  byte_monitor: [160, 20],
  checkbox: [100, 20],
  combo: [100, 30],
  display: [800, 800],
  ellipse: [100, 50],
  embedded: [400, 300],
  group: [300, 200],
  label: [100, 20],
  led: [20, 20],
  textupdate: [100, 20],
  textentry: [100, 20],
  picture: [150, 100],
  polygon: [100, 20],
  polyline: [100, 20],
  progressbar: [100, 20],
  rectangle: [100, 20],
  scaledslider: [400, 55],
  symbol: [100, 100]
};

function bobParseType(props: any): string {
  const typeId = props._attributes.type;
  if (BOB_WIDGET_MAPPING.hasOwnProperty(typeId)) {
    return BOB_WIDGET_MAPPING[typeId];
  } else {
    return typeId;
  }
}

export function bobParseNumber(jsonProp: ElementCompact): number | undefined {
  try {
    return Number(jsonProp._text);
  } catch {
    return undefined;
  }
}

function bobParsePosition(props: any): Position {
  // Find type of widget and map to default width and height for that widget
  const widget = props._attributes.type;
  return new AbsolutePosition(
    `${bobParseNumber(props.x) ?? 0}px`,
    `${bobParseNumber(props.y) ?? 0}px`,
    `${bobParseNumber(props.width) ?? WIDGET_DEFAULT_SIZES[widget][0]}px`,
    `${bobParseNumber(props.height) ?? WIDGET_DEFAULT_SIZES[widget][1]}px`
  );
}

function bobParseFormatType(jsonProp: ElementCompact): string {
  const formats: { [key: number]: string } = {
    0: "default",
    1: "decimal",
    2: "exponential",
    6: "string"
  };
  return formats[bobParseNumber(jsonProp) ?? 0];
}

export function bobParseFont(jsonProp: ElementCompact): Font {
  const opiStyles: { [key: string]: FontStyle } = {
    REGULAR: FontStyle.Regular,
    BOLD: FontStyle.Bold,
    ITALIC: FontStyle.Italic,
    BOLD_ITALIC: FontStyle.BoldItalic
  };
  const fontAttributes = jsonProp["font"]._attributes;
  const { family, size, style } = fontAttributes;
  return new Font(Number(size), opiStyles[style], family);
}

function bobParseBorder(props: any): Border {
  let width: number | undefined = 0;
  let borderColor = Color.BLACK;
  try {
    width = bobParseNumber(props.border_width);
    borderColor = opiParseColor(props.border_color);
  } catch {
    // Default to width 0 -> no border
  }
  if (width) {
    return new Border(BorderStyle.Line, borderColor, width);
  } else {
    return Border.NONE;
  }
}

export function bobParseAlarmSensitive(props: any): boolean {
  // If property is missing the default is true
  let alarmSensitive = true;
  if (props.border_alarm_sensitive !== undefined) {
    alarmSensitive = opiParseBoolean(props.border_alarm_sensitive);
  }
  return alarmSensitive;
}

function bobParseItems(jsonProp: ElementCompact): string[] {
  const items: string[] = [];
  jsonProp["item"].forEach((item: any) => {
    items.push(item._text);
  });
  return items;
}

/**
 * Parse file for Embedded Display widgets
 * @param props
 * @returns
 */
function bobParseFile(props: any): OpiFile {
  const filename = opiParseString(props.file);
  let macros = {};
  if (props.macros) {
    macros = opiParseMacros(props.macros);
  }
  return {
    path: filename,
    macros,
    defaultProtocol: "ca"
  };
}

/**
 * Parse points object into an array of number arrays
 * with x and y coordinates. Compared to opi, bob uses
 * coordinates relative to widget x and y
 * @param props
 */
function bobParsePoints(props: any): Points {
  const points: Array<Point> = [];
  props.point.forEach((point: any) => {
    const pointData = point._attributes;
    points.push(new Point(Number(pointData["x"]), Number(pointData["y"])));
  });
  return new Points(points);
}

/**
 * Parse numbers for resizing into strings that say what
 * time of resizing should be performed
 * @param jsonProp
 */
function bobParseResizing(jsonProp: ElementCompact): string {
  const resizeOpt = bobParseNumber(jsonProp);
  switch (resizeOpt) {
    case 1:
      return "size-content";
    case 2:
      return "crop-widget";
    case 3:
      return "stretch-content";
    case 4:
      return "crop-content";
    default:
      return "scroll-content";
  }
}

function bobParseSymbols(jsonProp: ElementCompact): string[] {
  const symbols: string[] = [];
  Object.values(jsonProp["symbol"]).forEach((item: any) => {
    // For a single symbol, we are passed a string. For multiple symbols
    // we are passed an object, so we need to return string from it
    symbols.push(typeof item === "string" ? item : item._text);
  });
  return symbols;
}
/**
 * Creates a WidgetActions object from the actions tied to the json object
 * @param jsonProp
 * @param defaultProtocol
 */
export function bobParseActions(
  jsonProp: ElementCompact,
  defaultProtocol: string
): WidgetActions {
  const actionsToProcess = toArray(jsonProp.action);

  // Extract information about whether to execute all actions at once
  const executeAsOne = jsonProp._attributes?.execute_as_one === "true";

  // Turn into an array of Actions
  const processedActions: WidgetActions = {
    executeAsOne: executeAsOne,
    actions: []
  };

  const actionToLocation = (action: ElementCompact): string => {
    // Bob options "replace" and "tab" correspond to opening
    // in the main view, or in a new panel/tab
    const target = action.target._text;
    switch (target) {
      case "replace":
        return "main";
      case "tab":
        // If a named tab is given, open there
        // Otherwise default to main
        if (action.name) return action.name._text;
        return "main";
      default:
        return "main";
    }
  };

  actionsToProcess.forEach((action): void => {
    log.debug(action);
    const type = action._attributes?.type;
    try {
      if (type === "write_pv") {
        processedActions.actions.push({
          type: WRITE_PV,
          writePvInfo: {
            pvName: opiParsePvName(
              action.pv_name,
              defaultProtocol
            ).qualifiedName(),
            value: action.value._text,
            description:
              (action.description && action.description._text) || undefined
          }
        });
      } else if (type === "open_webpage") {
        processedActions.actions.push({
          type: OPEN_WEBPAGE,
          openWebpageInfo: {
            url: action.url._text,
            description:
              (action.description && action.description._text) || undefined
          }
        });
      } else if (type === "open_display") {
        const type = action.target._text === "replace" ? OPEN_PAGE : OPEN_TAB;
        processedActions.actions.push({
          type: type,
          dynamicInfo: {
            name: action.file._text,
            location: actionToLocation(action),
            description:
              (action.description && action.description._text) || undefined,
            file: {
              path: action.file._text,
              // TODO: Should probably be accessing properties of the element here
              macros: {},
              defaultProtocol: "ca"
            }
          }
        });
      }
    } catch (e: any) {
      log.error(
        `Could not find action of type ${type} in available actions to convert: ${e.message}`
      );
    }
  });

  return processedActions;
}

function bobGetTargetWidget(props: any): React.FC {
  const typeid = bobParseType(props);
  let targetWidget;
  try {
    targetWidget = REGISTERED_WIDGETS[typeid][0];
  } catch {
    targetWidget = REGISTERED_WIDGETS["shape"][0];
  }
  return targetWidget;
}

const BOB_COMPLEX_PARSERS: ComplexParserDict = {
  ...OPI_COMPLEX_PARSERS,
  type: bobParseType,
  position: bobParsePosition,
  border: bobParseBorder,
  alarmSensitive: bobParseAlarmSensitive,
  file: bobParseFile
};

export function parseBob(
  xmlString: string,
  defaultProtocol: string,
  filepath: string
): WidgetDescription {
  // Convert it to a "compact format"
  const compactJSON = xml2js(xmlString, {
    compact: true
  }) as XmlDescription;
  compactJSON.display._attributes.type = "display";
  log.debug(compactJSON);

  const simpleParsers: ParserDict = {
    ...OPI_SIMPLE_PARSERS,
    pvName: [
      "pv_name",
      (pvName: ElementCompact): PV => opiParsePvName(pvName, defaultProtocol)
    ],
    font: ["font", bobParseFont],
    actions: [
      "actions",
      (actions: ElementCompact): WidgetActions =>
        bobParseActions(actions, defaultProtocol)
    ],
    items: ["items", bobParseItems],
    imageFile: ["file", opiParseString],
    points: ["points", bobParsePoints],
    resize: ["resize", bobParseResizing],
    squareLed: ["square", opiParseBoolean],
    formatType: ["format", bobParseFormatType],
    stretchToFit: ["stretch_image", opiParseBoolean],
    macros: ["macros", opiParseMacros],
    symbols: ["symbols", bobParseSymbols],
    initialIndex: ["initial_index", bobParseNumber],
    showIndex: ["show_index", opiParseBoolean],
    fallbackSymbol: ["fallback_symbol", opiParseString],
    rotation: ["rotation", bobParseNumber],
    styleOpt: ["style", bobParseNumber],
    lineColor: ["line_color", opiParseColor]
  };

  const complexParsers = {
    ...BOB_COMPLEX_PARSERS,
    rules: (rules: Rule[]): Rule[] =>
      opiParseRules(rules, defaultProtocol, false)
  };

  const displayWidget = parseWidget(
    compactJSON.display,
    bobGetTargetWidget,
    "widget",
    simpleParsers,
    complexParsers,
    false,
    OPI_PATCHERS,
    filepath
  );

  displayWidget.position = new RelativePosition(
    displayWidget.position.width,
    displayWidget.position.height
  );

  return displayWidget;
}
