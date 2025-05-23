// Allow use of any for parsing JSON.
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import log from "loglevel";
import { ElementCompact, xml2js } from "xml-js";
import { Rule, Expression, OpiFile } from "../../../types/props";
import { MacroMap } from "../../../types/macros";
import { Color } from "../../../types/color";
import { FontStyle, Font } from "../../../types/font";
import { Border, BorderStyle } from "../../../types/border";
import {
  Position,
  AbsolutePosition,
  RelativePosition
} from "../../../types/position";
import { Traces, Trace } from "../../../types/traces";
import { Axes, Axis } from "../../../types/axes";
import {
  ComplexParserDict,
  ParserDict,
  parseWidget,
  toArray,
  PatchFunction
} from "./parser";
import { REGISTERED_WIDGETS } from "../register";
import { WidgetDescription } from "../createComponent";
import { PV } from "../../../types/pv";
import {
  WRITE_PV,
  OPEN_WEBPAGE,
  WidgetActions,
  OPEN_TAB,
  EXIT
} from "../widgetActions";
import { snakeCaseToCamelCase } from "../utils";
import { Point, Points } from "../../../types/points";

export interface XmlDescription {
  _attributes: { [key: string]: string };
  x?: { _text: string };
  y?: { _text: string };
  height?: { _text: string };
  width?: { _text: string };
  widget?: XmlDescription;
  [key: string]: any;
}

/**
 * maps a widget typeId specified in an opi file to a corresponding registered
 * widget name
 */
const OPI_WIDGET_MAPPING: { [key: string]: any } = {
  "org.csstudio.opibuilder.Display": "display",
  "org.csstudio.opibuilder.widgets.arc": "arc",
  "org.csstudio.opibuilder.widgets.bytemonitor": "bytemonitor",
  "org.csstudio.opibuilder.widgets.Ellipse": "ellipse",
  "org.csstudio.opibuilder.widgets.TextUpdate": "readback",
  "org.csstudio.opibuilder.widgets.TextInput": "input",
  "org.csstudio.opibuilder.widgets.Label": "label",
  "org.csstudio.opibuilder.widgets.groupingContainer": "groupingcontainer",
  "org.csstudio.opibuilder.widgets.Rectangle": "shape",
  "org.csstudio.opibuilder.widgets.RoundedRectangle": "shape",
  "org.csstudio.opibuilder.widgets.ActionButton": "actionbutton",
  "org.csstudio.opibuilder.widgets.BoolButton": "boolbutton",
  "org.csstudio.opibuilder.widgets.MenuButton": "menubutton",
  "org.csstudio.opibuilder.widgets.combo": "menubutton",
  "org.csstudio.opibuilder.widgets.checkbox": "checkbox",
  "org.csstudio.opibuilder.widgets.choiceButton": "choicebutton",
  "org.csstudio.opibuilder.widgets.linkingContainer": "embeddedDisplay",
  "org.csstudio.opibuilder.widgets.polyline": "line",
  "org.csstudio.opibuilder.widgets.polygon": "polygon",
  "org.csstudio.opibuilder.widgets.symbol.multistate.MultistateMonitorWidget":
    "symbol",
  "org.csstudio.opibuilder.widgets.progressbar": "progressbar",
  "org.csstudio.opibuilder.widgets.LED": "led",
  "org.csstudio.opibuilder.widgets.Image": "image",
  "org.csstudio.opibuilder.widgets.edm.symbolwidget": "pngsymbol",
  "org.csstudio.opibuilder.widgets.detailpanel": "device",
  "org.csstudio.opibuilder.widgets.dawn.xygraph": "xyplot",
  "org.csstudio.opibuilder.widgets.xyGraph": "xyplot"
};

/**
 * Attempts to return the text from a json property, otherwise throws an error
 * @param jsonProp
 */
export function opiParseString(jsonProp: ElementCompact): string {
  if (typeof jsonProp._text === "string") {
    return jsonProp._text;
  } else {
    throw new Error(`Could not parse text from value ${jsonProp._text}`);
  }
}

/**
 * Attempts to return a boolean from the text representation of a boolean
 * on a json property, otherwise throws an error
 * @param jsonProp
 */
export function opiParseBoolean(jsonProp: ElementCompact): boolean {
  const boolText = jsonProp._text;
  if (boolText === "false") {
    return false;
  } else if (boolText === "true") {
    return true;
  } else {
    throw new Error(`Could not parse boolean from value ${boolText}`);
  }
}

export interface OpiColor {
  _attributes: { name: string; red: string; blue: string; green: string };
}

/**
 * Returns a Color object from a json property
 * @param jsonProp
 */
export function opiParseColor(jsonProp: ElementCompact): Color {
  const color = jsonProp.color as OpiColor;
  return Color.fromRgba(
    parseInt(color._attributes.red),
    parseInt(color._attributes.green),
    parseInt(color._attributes.blue)
  );
}

/**
 * Returns a Font object extracted from a json property
 * @param jsonProp
 */
export function opiParseFont(jsonProp: ElementCompact): Font {
  const opiStyles: { [key: number]: FontStyle } = {
    0: FontStyle.Regular,
    1: FontStyle.Bold,
    2: FontStyle.Italic,
    3: FontStyle.BoldItalic
  };
  let fontAttributes;
  if (jsonProp.hasOwnProperty("fontdata")) {
    fontAttributes = jsonProp["fontdata"]._attributes;
  } else {
    fontAttributes = jsonProp["opifont.name"]._attributes;
  }
  const { fontName, height, style } = fontAttributes;
  return new Font(height, opiStyles[style], fontName);
}

/**
 * Returns a macro map from a json object
 * @param jsonProp
 */
export function opiParseMacros(jsonProp: ElementCompact): MacroMap {
  const macroMap: MacroMap = {};
  Object.entries(jsonProp as Record<string, any>).forEach(
    ([key, value]): void => {
      macroMap[key] = value["_text"] ?? "";
    }
  );
  return macroMap;
}

/**
 * Creates a WidgetActions object from the actions tied to the json object
 * @param jsonProp
 * @param defaultProtocol
 */
export function opiParseActions(
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
    // Handle both Position and mode for now.
    const mode = action.mode?._text;
    const position = action.Position?._text;
    switch (mode) {
      case "1":
        return "main";
      case "3":
        return "details";
      default:
        switch (position) {
          case "1":
            return "details";
          default:
            return "main";
        }
    }
  };

  actionsToProcess.forEach((action): void => {
    log.debug(action);
    const type = action._attributes?.type;
    try {
      if (type === WRITE_PV) {
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
      } else if (type === OPEN_WEBPAGE) {
        processedActions.actions.push({
          type: OPEN_WEBPAGE,
          openWebpageInfo: {
            url: action.hyperlink._text,
            description:
              (action.description && action.description._text) || undefined
          }
        });
      } else if (type === "OPEN_DISPLAY" || type === "OPEN_OPI_IN_VIEW") {
        processedActions.actions.push({
          type: OPEN_TAB,
          dynamicInfo: {
            name: action.path._text,
            location: actionToLocation(action),
            description:
              (action.description && action.description._text) || undefined,
            file: {
              path: action.path._text,
              // TODO: Should probably be accessing properties of the element here
              macros: {},
              defaultProtocol: "ca"
            }
          }
        });
      }
    } catch (e) {
      log.error(
        `Could not find action of type ${type} in available actions to convert`
      );
    }
  });

  return processedActions;
}

/**
 * Returns a rules object from a json element
 * @param jsonProp
 * @param defaultProtocol
 */
export const opiParseRules = (
  jsonProp: ElementCompact,
  defaultProtocol: string,
  isOpiFile: boolean
): Rule[] => {
  if (!jsonProp.rules) {
    return [];
  } else {
    const ruleArray = toArray(jsonProp.rules.rule);
    const rules = ruleArray.map((ruleElement: ElementCompact) => {
      const name = ruleElement._attributes?.name as string;
      const xmlProp = ruleElement._attributes?.prop_id as string;

      const outExp = ruleElement._attributes?.out_exp === "true";
      const pvArray = toArray(isOpiFile ? ruleElement.pv : ruleElement.pv_name);
      const pvs = pvArray.map((pv: ElementCompact) => {
        return {
          pvName: opiParsePvName(pv, defaultProtocol),
          trigger: isOpiFile ? pv._attributes?.trig === "true" : true
        };
      });
      const expArray = toArray(ruleElement.exp);
      const expressions = expArray.map((expression: ElementCompact) => {
        const value = expression.value;
        return {
          boolExp: expression._attributes?.bool_exp as string,
          value: value
        };
      });
      return {
        name: name,
        prop: xmlProp,
        outExp: outExp,
        expressions: expressions,
        pvs: pvs
      };
    });
    return rules;
  }
};

/**
 * Creates a Number object from a json properties object
 * @param jsonProp
 */
function opiParseNumber(jsonProp: ElementCompact): number {
  return Number(jsonProp._text);
}

/**
 * Creates a new PV object after extracting the pvName from the json object
 * @param jsonProp
 * @param defaultProtocol
 */
export function opiParsePvName(
  jsonProp: ElementCompact,
  defaultProtocol: string
): PV {
  const rawPv = opiParseString(jsonProp);
  return PV.parse(rawPv, defaultProtocol);
}

/**
 * Converts an alignment number present in the json properties, into
 * a string e.g. "left", "center", "right"
 * @param jsonProp
 */
function opiParseHorizontalAlignment(jsonProp: ElementCompact): string {
  const alignments: { [key: number]: string } = {
    0: "left",
    1: "center",
    2: "right"
  };
  return alignments[opiParseNumber(jsonProp)];
}

/**
 * Converts a vertical alignment number present in the json properties, into
 * a string e.g. "top", "center", "bottom"
 * @param jsonProp
 */
function opiParseVerticalAlignment(jsonProp: ElementCompact): string {
  const alignments: { [key: number]: string } = {
    0: "top",
    1: "center",
    2: "bottom"
  };
  return alignments[opiParseNumber(jsonProp)];
}

/**
 * Converts an format type number present in the json properties, into
 * a string e.g. "left", "center", "right"
 * @param jsonProp
 */
function opiParseFormatType(jsonProp: ElementCompact): string {
  const formats: { [key: number]: string } = {
    0: "default",
    1: "decimal",
    2: "exponential",
    4: "string"
  };
  return formats[opiParseNumber(jsonProp)];
}

/**
 * Creates a new Border object
 * @param props
 */
function opiParseBorder(props: any): Border {
  const borderStyles: { [key: number]: BorderStyle } = {
    0: BorderStyle.None,
    1: BorderStyle.Line,
    2: BorderStyle.Outset,
    8: BorderStyle.Dotted,
    9: BorderStyle.Dashed,
    13: BorderStyle.GroupBox
  };
  let style = BorderStyle.None;
  let width = 0;
  let borderColor = Color.BLACK;
  /* Line color can override border for certain widgets. */
  let lineColor;
  try {
    style = borderStyles[opiParseNumber(props.border_style)];
    width = opiParseNumber(props.border_width);
    borderColor = opiParseColor(props.border_color);
    lineColor = opiParseColor(props.line_color);
  } catch {
    // If we can't parse these, assume the defaults.
  }
  // Raised border in opis hard-codes width and color.
  if (style === BorderStyle.Outset) {
    width = 1;
    borderColor = Color.GREY;
  }
  const actualColor = width < 2 && lineColor ? lineColor : borderColor;
  const actualStyle = width < 2 && lineColor ? BorderStyle.Line : style;
  return new Border(actualStyle, actualColor, width);
}

/**
 * Converts a typeId into a registered component name using the
 * OPI_WIDGET_MAPPING object
 * @param props
 */
function opiParseType(props: any): string {
  const typeId = props._attributes.typeId;
  if (OPI_WIDGET_MAPPING.hasOwnProperty(typeId)) {
    return OPI_WIDGET_MAPPING[typeId];
  } else {
    return typeId;
  }
}

/**
 * Parses a props object into AbsolutePosition object
 * @param props
 */
function opiParsePosition(props: any): Position {
  const { x, y, width, height } = props;
  try {
    return new AbsolutePosition(
      `${opiParseNumber(x)}px`,
      `${opiParseNumber(y)}px`,
      `${opiParseNumber(width)}px`,
      `${opiParseNumber(height)}px`
    );
  } catch (error) {
    const msg = `Failed to parse position (${x},${y},${width},${height}): ${error}`;
    throw new Error(msg);
  }
}

function opiParseFile(props: any): OpiFile {
  const filename = opiParseString(props.opi_file);
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

export function opiParseAlarmSensitive(props: any): boolean {
  // Only one prop for alarm sensitivity at the moment.
  return (
    // opiParseBoolean(props.forecolor_alarm_sensitive) ||
    // opiParseBoolean(props.backcolor_alarm_sensitive) ||
    opiParseBoolean(props.border_alarm_sensitive)
  );
}

function opiParseLabelPosition(props: any): string {
  const num = opiParseNumber(props).toString();
  const mapping: { [key: string]: string } = {
    1: "top",
    2: "left",
    3: "center",
    4: "right",
    5: "bottom",
    6: "top left",
    7: "top right",
    8: "bottom left",
    9: "bottom right"
  };
  return mapping[num] || "top";
}

/**
 * Parses a props object into an Traces object that
 * contains an array of Trace objects
 * @param props list of props for this element
 * @returns a Traces object
 */
function opiParseTraces(props: any): Traces {
  // Find PV value if it's one of the trace properties
  let pvName = opiParseString(props.pv_name);
  if (pvName.includes("trace_")) {
    pvName = opiParseString(props[pvName.slice(2, -1)]);
  }
  const count = opiParseNumber(props.trace_count);
  const traces: Trace[] = [];
  // Parse all of the 'trace' properties
  for (let i = 0; i < count; i++) {
    const trace = parseMultipleNamedProps("trace", props, new Trace(i));
    traces.push(trace);
  }
  return new Traces(count, pvName, traces);
}

/**
 * Parses a props object into an AllAxes object that
 * contains an array of Axis objects
 * @param props
 * @returns an Axes object.
 */
function opiParseAxes(props: any): Axes {
  const count = opiParseNumber(props.axis_count);
  const axes: Axis[] = [];
  // Parse all of the 'axis' properties
  for (let i = 0; i < count; i++) {
    const axis = parseMultipleNamedProps("axis", props, new Axis(i));
    axes.push(axis);
  }
  return new Axes(count, axes);
}

/**
 * Iterate over and parse props that have
 * format {name}_{number}_{actual prop name}. Returns
 * an array of these props.
 * @param name string to search for in prop names
 * @param props props to parse
 * @param idx number to search for in prop names
 * @returns object containing parsed props
 */
function parseMultipleNamedProps(name: string, props: any, obj: any) {
  // Create keyword string and search for matches
  const num = `${name}_${obj.index}_`;
  const names = Object.getOwnPropertyNames(props);
  const newProps = names.filter(s => s.includes(num));
  newProps.forEach(item => {
    // For each match, convert the name and parse
    const newName = snakeCaseToCamelCase(item, num.length, undefined);
    try {
      if (newName) {
        // Get the type of the property
        const match = obj[newName];
        if (typeof match === "boolean") {
          obj[newName] = opiParseBoolean(props[item]);
        } else if (typeof match === "number") {
          obj[newName] = opiParseNumber(props[item]);
        } else if (typeof match === "string") {
          obj[newName] = opiParseString(props[item]);
        } else if (match instanceof Color) {
          obj[newName] = opiParseColor(props[item]);
        } else if (match instanceof Font) {
          obj[newName] = opiParseFont(props[item]);
        }
      }
    } catch {
      // Sometimes properties exist but are empty e.g. <axis_0_axis_title />
      // and trying to parse this throws an exception. We want to catch and ignore
      // this, and not include the empty property in our new obj.
    }
  });
  // Return instance of trace/axis with parsed props in it
  return obj;
}

/**
 * Parseas a props point object into an array of number arrays
 * with x and y coordinates
 * @param props
 */
function opiParsePoints(props: any): Points {
  const points: Array<Point> = [];
  const x = opiParseNumber(props.x);
  const y = opiParseNumber(props.y);
  props.points?.point.forEach((point: any) => {
    const pointData = point._attributes;
    points.push(
      new Point(Number(pointData["x"]) - x, Number(pointData["y"]) - y)
    );
  });
  return new Points(points);
}

/**
 * Parse an array of items
 * @param jsonProp
 * @returns items (array of strings)
 */
function opiParseItems(jsonProp: ElementCompact): string[] {
  const items: string[] = [];
  jsonProp["s"].forEach((item: any) => {
    items.push(item._text);
  });
  return items;
}

/**
 * Parse numbers for resizing into strings that say what
 * time of resizing should be performed
 * @param jsonProp
 */
function opiParseResizing(jsonProp: ElementCompact): string {
  const resizeOpt = opiParseNumber(jsonProp);
  switch (resizeOpt) {
    case 0:
      return "size-content";
    case 1:
      return "size-widget";
    case 2:
      return "crop-content";
    case 3:
      return "scroll-content";
    default:
      return "size-widget";
  }
}

/**
 * Attempt to return the widget associated with a props object, failing
 * that will return a shape object
 * @param props
 */
function opiGetTargetWidget(props: any): React.FC {
  const typeid = opiParseType(props);
  let targetWidget;
  try {
    targetWidget = REGISTERED_WIDGETS[typeid][0];
  } catch {
    targetWidget = REGISTERED_WIDGETS["shape"][0];
  }
  return targetWidget;
}

/**
 * Simple object types, with the name they appear under in the .opi file
 * and the parsing function to use
 */
export const OPI_SIMPLE_PARSERS: ParserDict = {
  text: ["text", opiParseString],
  name: ["name", opiParseString],
  textAlign: ["horizontal_alignment", opiParseHorizontalAlignment],
  textAlignV: ["vertical_alignment", opiParseVerticalAlignment],
  backgroundColor: ["background_color", opiParseColor],
  foregroundColor: ["foreground_color", opiParseColor],
  onColor: ["on_color", opiParseColor],
  offColor: ["off_color", opiParseColor],
  fillColor: ["fill_color", opiParseColor],
  precision: ["precision", opiParseNumber],
  formatType: ["format_type", opiParseFormatType],
  precisionFromPv: ["precision_from_pv", opiParseBoolean],
  visible: ["visible", opiParseBoolean],
  showUnits: ["show_units", opiParseBoolean],
  transparent: ["transparent", opiParseBoolean],
  horizontal: ["horizontal", opiParseBoolean],
  wrapWords: ["wrap_words", opiParseBoolean],
  logScale: ["log_scale", opiParseBoolean],
  font: ["font", opiParseFont],
  macroMap: ["macros", opiParseMacros],
  imageFile: ["image_file", opiParseString],
  imageIndex: ["image_index", opiParseNumber],
  image: ["image", opiParseString],
  showBooleanLabel: ["show_boolean_label", opiParseBoolean],
  showLabel: ["show_label", opiParseBoolean],
  labelPosition: ["boolean_label_position", opiParseLabelPosition],
  tooltip: ["tooltip", opiParseString],
  stretchToFit: ["stretch_to_fit", opiParseBoolean],
  lineWidth: ["line_width", opiParseNumber],
  width: ["width", opiParseNumber],
  height: ["height", opiParseNumber],
  label: ["label", opiParseString],
  opiFile: ["opi_file", opiParseString],
  rotationAngle: ["rotation_angle", opiParseNumber],
  rotation: ["degree", opiParseNumber],
  flipHorizontal: ["flip_horizontal", opiParseBoolean],
  flipVertical: ["flip_vertical", opiParseBoolean],
  bit: ["bit", opiParseNumber],
  actionsFromPv: ["actions_from_pv", opiParseBoolean],
  itemsFromPv: ["items_from_pv", opiParseBoolean],
  items: ["items", opiParseItems],
  deviceName: ["device_name", opiParseString],
  autoZoomToFit: ["auto_zoom_to_fit_all", opiParseBoolean],
  plotBackgroundColor: ["plot_area_background_color", opiParseColor], //these are all plot props
  title: ["title", opiParseString],
  titleFont: ["title_font", opiParseFont],
  showLegend: ["show_legend", opiParseBoolean],
  showPlotBorder: ["show_plot_area_border", opiParseBoolean],
  showToolbar: ["show_toolbar", opiParseBoolean],
  bgGradientColor: ["bg_gradient_color", opiParseColor],
  fgGradientColor: ["fg_gradient_color", opiParseColor],
  gradient: ["gradient", opiParseBoolean],
  fillLevel: ["fill_level", opiParseNumber],
  horizontalFill: ["horizontal_fill", opiParseBoolean],
  fill: ["fill", opiParseBoolean],
  lineColor: ["line_color", opiParseColor],
  onLabel: ["on_label", opiParseString],
  offLabel: ["off_label", opiParseString],
  onState: ["on_state", opiParseNumber],
  offState: ["off_state", opiParseNumber],
  startAngle: ["start_angle", opiParseNumber],
  totalAngle: ["total_angle", opiParseNumber],
  numBits: ["numBits", opiParseNumber],
  startBit: ["startBit", opiParseNumber],
  ledBorder: ["led_border", opiParseNumber],
  ledBorderColor: ["led_border_color", opiParseColor],
  bitReverse: ["bitReverse", opiParseBoolean],
  squareLed: ["square_led", opiParseBoolean],
  squareButton: ["square_button", opiParseBoolean],
  effect3d: ["effect_3d", opiParseBoolean],
  showLed: ["show_led", opiParseBoolean],
  cornerWidth: ["corner_width", opiParseString],
  cornerHeight: ["corner_height", opiParseString],
  arrows: ["arrows", opiParseNumber],
  arrowLength: ["arrow_length", opiParseNumber],
  fillArrow: ["fill_arrow", opiParseBoolean],
  selectedColor: ["selected_color", opiParseColor],
  enabled: ["enabled", opiParseBoolean],
  resize: ["resize_behaviour", opiParseResizing],
  labelsFromPv: ["labels_from_pv", opiParseBoolean]
};

/**
 * Complex object types, with the parsing function to use, no name
 * like the simple parser object because they do not have one name
 * in the .opi file
 */
export const OPI_COMPLEX_PARSERS: ComplexParserDict = {
  type: opiParseType,
  position: opiParsePosition,
  border: opiParseBorder,
  file: opiParseFile,
  alarmSensitive: opiParseAlarmSensitive,
  traces: opiParseTraces,
  axes: opiParseAxes,
  points: opiParsePoints
};

function opiPatchRules(widgetDescription: WidgetDescription): void {
  /* Re-index simple parsers so we can find the correct one
     for the opi prop. */
  const opiPropParsers: ParserDict = {};
  Object.entries(OPI_SIMPLE_PARSERS).forEach(([jsonProp, vals]) => {
    opiPropParsers[vals[0]] = [jsonProp, vals[1]];
  });
  /* Patch up the rules by converting the prop to our name
     and converting the value to the correct type. */
  widgetDescription.rules?.forEach((rule: Rule) => {
    if (opiPropParsers.hasOwnProperty(rule.prop)) {
      const [newPropName, parser] = opiPropParsers[rule.prop];
      rule.prop = newPropName;
      rule.expressions.forEach((expression: Expression) => {
        const convertedValue = parser(expression.value);
        expression.convertedValue = convertedValue;
      });
    }
  });
}

function normalisePath(path: string, parentDir?: string): string {
  let prefix = parentDir ?? "";
  while (path.startsWith("../")) {
    path = path.substr(3);
    prefix = prefix.substr(0, prefix.lastIndexOf("/"));
  }
  return `${prefix}/${path}`;
}

function opiPatchPaths(
  widgetDescription: WidgetDescription,
  parentDir?: string
): void {
  log.debug(`opiPatchPaths ${parentDir}`);
  // file: OpiFile type
  if (
    widgetDescription["file"] &&
    parentDir &&
    !widgetDescription["file"].path.startsWith("http")
  ) {
    widgetDescription["file"].path = normalisePath(
      widgetDescription["file"].path,
      parentDir
    );
    log.debug(`Corrected opi file to ${widgetDescription["file"].path}`);
  }
  // imageFile and image: just strings
  for (const prop of ["imageFile", "image"]) {
    // If image over http do not manipulate path.
    if (widgetDescription[prop]?.startsWith("http")) {
      continue;
    }
    if (widgetDescription[prop]) {
      widgetDescription[prop] = normalisePath(
        widgetDescription[prop],
        parentDir
      );
      log.debug(`Corrected image file to ${widgetDescription.imageFile}`);
    }
  }
  // action.file: OpiFile type
  if (widgetDescription.actions && parentDir) {
    for (const action of widgetDescription.actions.actions) {
      if (action.dynamicInfo) {
        action.dynamicInfo.file.path = normalisePath(
          action.dynamicInfo.file.path,
          parentDir
        );
        log.debug(`Corrected path to ${action.dynamicInfo.file.path}`);
      }
    }
  }
}

function opiPatchActions(widgetDescription: WidgetDescription): void {
  if (
    widgetDescription.type === "actionbutton" &&
    widgetDescription.text &&
    widgetDescription.text.toLowerCase() === "exit"
  ) {
    if (
      !widgetDescription.actions ||
      widgetDescription.actions.actions.length === 0
    ) {
      widgetDescription.actions = {
        executeAsOne: false,
        actions: [
          {
            type: EXIT,
            exitInfo: {
              description: "Exit"
            }
          }
        ]
      };
    }
  }
}

export const OPI_PATCHERS: PatchFunction[] = [
  opiPatchRules,
  opiPatchPaths,
  opiPatchActions
];

export function parseOpi(
  xmlString: string,
  defaultProtocol: string,
  filepath: string
): WidgetDescription {
  // Convert it to a "compact format"
  const compactJSON = xml2js(xmlString, {
    compact: true
  }) as XmlDescription;
  // We don't care about the position of the top-level display widget.
  // We place it at 0,0 within its container.
  compactJSON.display.x = { _text: "0" };
  compactJSON.display.y = { _text: "0" };
  log.debug(compactJSON);

  const simpleParsers: ParserDict = {
    ...OPI_SIMPLE_PARSERS,
    pvName: [
      "pv_name",
      (pvName: ElementCompact): PV => opiParsePvName(pvName, defaultProtocol)
    ],
    actions: [
      "actions",
      (actions: ElementCompact): WidgetActions =>
        opiParseActions(actions, defaultProtocol)
    ]
  };

  const complexParsers = {
    ...OPI_COMPLEX_PARSERS,
    rules: (rules: Rule[]): Rule[] =>
      opiParseRules(rules, defaultProtocol, true)
  };

  log.debug(compactJSON.display);

  const displayWidget = parseWidget(
    compactJSON.display,
    opiGetTargetWidget,
    "widget",
    simpleParsers,
    complexParsers,
    false,
    OPI_PATCHERS,
    filepath
  );

  displayWidget.position = new RelativePosition(
    // Handle generated display widgets with no width or height.
    displayWidget.position?.x,
    displayWidget.position?.y,
    displayWidget.position?.width,
    displayWidget.position?.height
  );
  return displayWidget;
}
