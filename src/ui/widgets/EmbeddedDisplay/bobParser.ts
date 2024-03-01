import { REGISTERED_WIDGETS } from "../register";
import { ComplexParserDict, parseWidget, ParserDict } from "./parser";
import {
  XmlDescription,
  OPI_COMPLEX_PARSERS,
  OPI_SIMPLE_PARSERS,
  OPI_PATCHERS,
  opiParseRules,
  opiParsePvName,
  opiParseActions,
  opiParseColor,
  opiParseAlarmSensitive,
  opiParseString,
  opiParseMacros
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
import { WidgetActions } from "../widgetActions";
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
  group: "groupingcontainer",
  label: "label",
  led: "led",
  textupdate: "readback",
  textentry: "input",
  picture: "image",
  polygon: "polygon",
  polyline: "line",
  progressbar: "progressbar",
  rectangle: "shape",
  scaledslider: "slidecontrol"
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
  return new AbsolutePosition(
    `${bobParseNumber(props.x) ?? 0}px`,
    `${bobParseNumber(props.y) ?? 0}px`,
    `${bobParseNumber(props.width) ?? 300}px`,
    `${bobParseNumber(props.height) ?? 200}px`
  );
}

export function bobParseFont(jsonProp: ElementCompact): Font {
  const opiStyles: { [key: number]: FontStyle } = {
    0: FontStyle.Regular,
    1: FontStyle.Bold,
    2: FontStyle.Italic,
    3: FontStyle.BoldItalic
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
    points.push(
      new Point(Number(pointData["x"]), Number(pointData["y"]))
    );
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
      return "scroll-widget";
  }
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
  alarmSensitive: opiParseAlarmSensitive,
  file: bobParseFile,
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
    rules: [
      "rules",
      (rules: Rule[]): Rule[] => opiParseRules(rules, defaultProtocol)
    ],
    actions: [
      "actions",
      (actions: ElementCompact): WidgetActions =>
        opiParseActions(actions, defaultProtocol)
    ],
    imageFile: ["file", opiParseString],
    points: ["points", bobParsePoints],
    resize: ["resize", bobParseResizing]
  };

  const complexParsers = {
    ...BOB_COMPLEX_PARSERS,
    rules: (rules: Rule[]): Rule[] => opiParseRules(rules, defaultProtocol)
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
