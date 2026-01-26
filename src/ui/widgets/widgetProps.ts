import { PvDataCollection } from "../../redux/csState";
import {
  StringPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  BorderPropOpt,
  PositionProp,
  ActionsPropType,
  RulesPropOpt,
  PvTypePropOpt,
  PVMetadataType,
  ScriptsPropOpt
} from "./propTypes";

import { GenericProp } from "../../types/props";
import PropTypes from "prop-types";
import { File } from "../hooks/useFile";

// Internal prop types object for properties which are not in a standard widget
const BasicPropsType = {
  rules: RulesPropOpt,
  scripts: ScriptsPropOpt,
  actions: ActionsPropType,
  tooltip: StringPropOpt,
  border: BorderPropOpt,
  visible: BoolPropOpt
};

const PositionPropsType = {
  position: PositionProp
};

export const WidgetPropType = {
  ...PositionPropsType,
  ...BasicPropsType
};

const PvPropsAndMetdataType = {
  alarmBorder: BoolPropOpt,
  pvType: PvTypePropOpt,
  pvMetadataList: PropTypes.arrayOf(PVMetadataType)
};

// PropTypes object for a PV widget which can be expanded
export const PVWidgetPropType = {
  ...WidgetPropType,
  ...PvPropsAndMetdataType
};

type BasicProps = InferWidgetProps<typeof BasicPropsType>;
type PositionProps = InferWidgetProps<typeof PositionPropsType>;

type PvPropsAndMetdataProps = InferWidgetProps<typeof PvPropsAndMetdataType>;

type AnyOtherProps = {
  // All other props with valid types.
  id: string;
  [x: string]: GenericProp;
};

type BaseWidgetProps = { baseWidget: React.FC<any> };

type ComponentProps = {
  style?: Record<string, string>;
};

// Props used by the ConnectingComponentWidget wrapper
export type ConnectingComponentWidgetProps = BasicProps &
  PvPropsAndMetdataProps &
  PvDataCollection &
  AnyOtherProps &
  File;

// Props for the Widget wrapper component
export type PVWidgetComponent = BasicProps &
  PositionProps &
  BaseWidgetProps &
  PvPropsAndMetdataProps;

// type used by useMacros and useRules (not really props)
export type AnyProps = PVWidgetComponent &
  PvDataCollection &
  AnyOtherProps & { file: File };

// Types used by widget components implementations that display a value.
export type PVComponent = ComponentProps & PvDataCollection;
