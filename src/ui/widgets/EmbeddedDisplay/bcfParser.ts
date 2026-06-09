import { xml2js, ElementCompact } from "xml-js";
import { PV, newRelativePosition } from "../../../types";
import { MacroMap } from "../../../types/macros";
import { WidgetDescription } from "../createComponent";
import {
  BOB_COMPLEX_PARSERS,
  BOB_SIMPLE_PARSERS,
  bobGetTargetWidget,
  bobParseTabs,
  bobParseTraces,
  bobParseYAxes
} from "./bobParser";
import { XmlDescription, opiParsePvName, OPI_PATCHERS } from "./opiParser";
import { ParserDict, parseChildProps, parseWidget } from "./parser";

export async function parseBcf(
  xmlString: string,
  defaultProtocol: string,
  filepath: string,
  macros?: MacroMap
): Promise<WidgetDescription> {
  // Convert it to a "compact format"
  const compactJSON = xml2js(xmlString, {
    compact: true
  }) as XmlDescription;
  const display =
    compactJSON?.display ??
    compactJSON?.displayResponsive ??
    compactJSON?.displayGridLayout;
  const displayAttributes = {
    ...display,
    _attributes: {
      ...display._attributes,
      type: compactJSON?.display
        ? "display"
        : compactJSON?.displayResponsive
          ? "displayResponsive"
          : "displayGridLayout"
    },
    x: { _text: "0" },
    y: { _text: "0" }
  };

  compactJSON["display"] = displayAttributes;

  const simpleParsers: ParserDict = {
    ...BOB_SIMPLE_PARSERS,
    pvMetadataList: [
      "pv_name",
      (pvName: ElementCompact): { pvName: PV }[] => [
        { pvName: opiParsePvName(pvName, defaultProtocol) }
      ]
    ]
  };

  const complexParsers = {
    ...BOB_COMPLEX_PARSERS,
    traces: (props: ElementCompact) => bobParseTraces(props["traces"]),
    axes: (props: ElementCompact) => bobParseYAxes(props["y_axes"]),
    colors: (props: ElementCompact) =>
      parseChildProps(props["colors"], BOB_SIMPLE_PARSERS),
    tabs: async (props: ElementCompact) =>
      bobParseTabs(
        props["tabs"],
        simpleParsers,
        complexParsers,
        filepath,
        macros
      )
  };

  const classFile = await parseWidget(
    compactJSON.display,
    bobGetTargetWidget,
    "widget",
    simpleParsers,
    complexParsers,
    false,
    OPI_PATCHERS(BOB_SIMPLE_PARSERS, BOB_COMPLEX_PARSERS),
    filepath,
    macros,
    true
  );

  classFile.position = newRelativePosition(
    classFile.position.x,
    classFile.position.y,
    classFile.position.width,
    classFile.position.height
  );

  return classFile;
}
