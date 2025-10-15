import { xml2js, ElementCompact } from "xml-js";
import { Color, Font, FontStyle } from "../../../types";
import {
  XmlDescription,
  opiParseBoolean,
  opiParseString,
  opiParseNumber
} from "./opiParser";
import { parseChildProps, ParserDict } from "./parser";
import { Axis } from "../../../types/axis";
import { Archiver, Trace } from "../../../types/trace";
import { Plt } from "../../../types/plt";

const PLT_PARSERS: ParserDict = {
  start: ["start", opiParseString],
  end: ["end", opiParseString],
  grid: ["grid", opiParseBoolean],
  scroll: ["scroll", opiParseBoolean],
  scrollStep: ["scroll_step", opiParseNumber],
  updatePeriod: ["update_period", opiParseNumber],
  background: ["background", pltParseColor],
  foreground: ["foreground", pltParseColor],
  color: ["color", pltParseColor],
  traceType: ["trace_type", opiParseString],
  useAxisName: ["use_axis_name", opiParseBoolean],
  useTraceNames: ["use_trace_names", opiParseBoolean],
  right: ["right", opiParseBoolean],
  displayName: ["display_name", opiParseString],
  waveformIndex: ["waveform_index", opiParseNumber],
  period: ["period", opiParseNumber],
  linewidth: ["linewidth", opiParseNumber],
  pointType: ["point_type", pltParsePointType],
  name: ["name", opiParseString],
  ringSize: ["ring_size", opiParseNumber],
  request: ["request", opiParseString],
  archive: ["archive", pltParseArchiver],
  titleFont: ["title_font", pltParseFont],
  scaleFont: ["scale_font", pltParseFont],
  labelFont: ["label_font", pltParseFont],
  legendFont: ["legend_font", pltParseFont],
  min: ["min", opiParseNumber],
  max: ["max", opiParseNumber],
  axis: ["axis", opiParseNumber]
};

/**
 * Parses font from plt
 * @param jsonProp
 * @returns Font object
 */
function pltParseFont(jsonProp: ElementCompact) {
  const fontStyles: { [key: string]: FontStyle } = {
    0: FontStyle.Regular,
    1: FontStyle.Bold,
    2: FontStyle.Italic,
    3: FontStyle.BoldItalic
  };
  const fontElements = (jsonProp._text as string).split("|");
  const style = Number(fontElements.pop());
  const size = Number(fontElements.pop());
  const typeface = fontElements.pop();
  const font = new Font(size, fontStyles[style], typeface);
  return font;
}

/**
 * Converts point type as string to number matching
 * bob and opi format
 * @param jsonProp
 * @returns number
 */
function pltParsePointType(jsonProp: ElementCompact) {
  const point = jsonProp._text || "NONE";
  const pointTypes: any = {
    NONE: 0,
    SQUARES: 1,
    CIRCLES: 2,
    DIAMONDS: 3,
    XMARKS: 4,
    TRIANGLES: 5
  };
  return pointTypes[point];
}

/**
 * Parses Archiver Appliance reference, ensuring the
 * given URL starts with HTTP:// for requests
 * @param jsonProp
 * @returns Archiver object
 */
function pltParseArchiver(jsonProp: ElementCompact) {
  // Ensure archiver is using HTTP address
  const url = opiParseString(jsonProp.url);
  const archiverURL = `http://${url.split("://")[1]}`;
  const archive: Archiver = {
    name: opiParseString(jsonProp.name),
    url: archiverURL
  };
  return archive;
}

/**
 * Parses list of traces (pvs)
 * @param props
 * @returns list of Trace objects
 */
function pltParsePvlist(props: ElementCompact) {
  const traces: Trace[] = [];
  let parsedProps: any = {};
  if (props) {
    // If only one trace, we are passed an object instead
    // of an array
    if (props.pv.length > 1) {
      props.pv.forEach((trace: any) => {
        parsedProps = parseChildProps(trace, PLT_PARSERS);
        traces.push(
          new Trace({
            ...parsedProps,
            yPv: parsedProps.name,
            lineWidth: parsedProps.linewidth
          })
        );
      });
    } else {
      parsedProps = parseChildProps(props.pv, PLT_PARSERS);
      traces.push(
        new Trace({
          ...parsedProps,
          yPv: parsedProps.name,
          lineWidth: parsedProps.linewidth
        })
      );
    }
  }
  return traces;
}

/**
 * Parses axes from plt
 * @param props
 * @returns list of Axis objects
 */
function pltParseAxes(props: ElementCompact) {
  const axes: Axis[] = [];
  let parsedProps: any = {};
  if (props) {
    // If only once axis, we are passed an object instead
    // of an array
    if (props.axis.length > 1) {
      props.axis.forEach((axis: any) => {
        parsedProps = parseChildProps(axis, PLT_PARSERS);
        axes.push(
          new Axis({
            ...parsedProps,
            fromOpi: false,
            showGrid: parsedProps.grid,
            onRight: parsedProps.right,
            title: parsedProps.useAxisName ? parsedProps.name : "",
            titleFont: parsedProps.labelFont,
            minimum: parsedProps.min,
            maximum: parsedProps.max
          })
        );
      });
    } else {
      parsedProps = parseChildProps(props.axis, PLT_PARSERS);
      axes.push(
        new Axis({
          ...parsedProps,
          fromOpi: false,
          showGrid: parsedProps.grid,
          onRight: parsedProps.right,
          title: parsedProps.useAxisName ? parsedProps.name : "",
          titleFont: parsedProps.labelFont,
          minimum: parsedProps.min,
          maximum: parsedProps.max
        })
      );
    }
  }
  return axes;
}

/**
 * Parses Color
 * @param jsonProp
 * @returns Color object
 */
function pltParseColor(jsonProp: ElementCompact) {
  return Color.fromRgba(
    parseInt(jsonProp.red._text),
    parseInt(jsonProp.green._text),
    parseInt(jsonProp.blue._text),
    1
  );
}

/**
 * Parsees Plt file for Databrowser, returning a list of all
 * props
 * @param xmlString
 * @returns
 */
export async function parsePlt(
  file: ElementCompact,
  widgetType?: string | number
): Promise<Plt> {
  // TO DO - check file ext is plt
  let props = new Plt();
  if (widgetType === "databrowser" && typeof file._text === "string") {
    const databrowser: XmlDescription = await fetchPltFile(file._text);
    // Parse the simple props
    const pvlist = pltParsePvlist(databrowser["pvlist"]);
    const axes = pltParseAxes(databrowser["axes"]);
    props = new Plt({
      ...parseChildProps(databrowser, PLT_PARSERS),
      pvlist: pvlist,
      axes: axes
    });
  }
  return props;
}

/**
 * Async fetch of Plt file, converted into JSON
 * @param file
 * @returns JSON object
 */
async function fetchPltFile(file: string) {
  const filePromise = await fetch(file);
  const contents = await filePromise.text();
  // Convert it to a "compact format"
  const compactJSON = xml2js(contents, {
    compact: true
  }) as XmlDescription;
  const databrowser = compactJSON.databrowser;
  return databrowser;
}
