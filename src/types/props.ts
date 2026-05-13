import { Color, ColorBar } from "./color";
import { Font } from "./font";
import { MacroMap } from "./macros";
import { WidgetActions } from "../ui/widgets/widgetActions";
import { Border } from "./border";
import { Position } from "./position";
import { PV } from "./pv";
import { Archiver, Trace } from "./trace";
import { Axes, Axis } from "./axis";
import { Points } from "./points";
import { Plt } from "./plt";
import {
  ResponsiveBreakpoints,
  ResponsiveColumns,
  ResponsiveGridLayout,
  ResponsiveLayout
} from "./responsiveBreakpoints";
import { Rois } from "./rois";

export type GenericProp =
  | string
  | string[]
  | boolean
  | number
  | [number, number]
  | PV
  | { pvName: PV }[]
  | Color
  | Font
  | Border
  | Position
  | Rule[]
  | Script[]
  | MacroMap
  | WidgetActions
  | OpiFile
  | Trace[]
  | Axes
  | Axis
  | Points
  | Archiver
  | Plt
  | ResponsiveBreakpoints
  | ResponsiveColumns
  | ResponsiveGridLayout
  | ResponsiveLayout
  | ColorBar
  | Rois;

export interface Expression {
  boolExp: string;
  value: string;
  convertedValue?: GenericProp;
}

interface RulePV {
  pvName: PV;
  trigger: boolean;
}

type ScriptPV = RulePV;

export interface Rule {
  name: string;
  prop: string;
  outExp: boolean;
  pvs: RulePV[];
  expressions: Expression[];
}

export interface Script {
  file: string;
  pvs: ScriptPV[];
  text: string;
}

export interface OpiFile {
  path: string;
  macros: MacroMap;
  defaultProtocol: string;
}
