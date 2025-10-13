import { PvState } from "../../redux/csState";
import {
  StringPropOpt,
  BoolPropOpt,
  InferWidgetProps,
  BorderPropOpt,
  PositionProp,
  ActionsPropType,
  RulesPropOpt,
  PvPropOpt,
  PvTypePropOpt
} from "./propTypes";

import { GenericProp } from "../../types/props";
import { DType } from "../../types/dtypes";

// Internal prop types object for properties which are not in a standard widget
const PVBasicType = {
  pvName: PvPropOpt,
  pvType: PvTypePropOpt,
  alarmBorder: BoolPropOpt
};

const BasicPropsType = {
  rules: RulesPropOpt,
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

// PropTypes object for a PV widget which can be expanded
export const PVWidgetPropType = {
  ...PVBasicType,
  ...WidgetPropType
};

type BasicProps = InferWidgetProps<typeof BasicPropsType>;
type PositionProps = InferWidgetProps<typeof PositionPropsType>;

type PVBasicProps = InferWidgetProps<typeof PVBasicType>;
type PVExtendedProps = {
  id: string;
  connected?: boolean;
  readonly?: boolean;
  value?: DType;
};

type AnyOtherProps = {
  // All other props with valid types.
  [x: string]: GenericProp;
};

type BaseWidgetProps = { baseWidget: React.FC<any> };

type ComponentProps = {
  style?: Record<string, string>;
};

export type ConnectingComponentWidgetProps = BasicProps &
  PVBasicProps &
  PVExtendedProps &
  AnyOtherProps;
export type WidgetComponent = BasicProps & PositionProps & BaseWidgetProps;
export type PVWidgetComponent = WidgetComponent & PVBasicProps;
export type AnyProps = PVWidgetComponent & PVExtendedProps & AnyOtherProps;

export type PVComponent = ComponentProps & PvState;
export type PVInputComponent = PVComponent & { pvName: string };
