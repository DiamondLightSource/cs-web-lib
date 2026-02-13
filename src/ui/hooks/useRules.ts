import log from "loglevel";

import { useSubscription } from "./useSubscription";
import { useSelector } from "react-redux";
import {
  selectPvStates,
  pvStateComparator,
  PvArrayResults
} from "../../redux/csState";

import { AnyProps } from "../widgets/widgetProps";
import {
  dTypeCoerceString,
  dTypeGetAlarm,
  dTypeGetDoubleValue,
  AlarmQuality
} from "../../types/dtypes";
import { SubscriptionType } from "../../connection/plugin";
import { BorderStyle, newBorder } from "../../types/border";
import { ColorUtils } from "../../types/color";
import { opiParseColor } from "../widgets/EmbeddedDisplay/opiParser";
import { parseArrayString } from "../../misc/stringUtils";
import { pvQualifiedName } from "../../types/pv";

// See https://stackoverflow.com/questions/54542318/using-an-enum-as-a-dictionary-key
type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U;
};

const INT_SEVERITIES: EnumDictionary<AlarmQuality, number> = {
  [AlarmQuality.VALID]: 0,
  [AlarmQuality.ALARM]: 1, // Curious alarm/warning numbering
  [AlarmQuality.WARNING]: 2, // as in CS-Studio
  [AlarmQuality.INVALID]: -1,
  [AlarmQuality.UNDEFINED]: -1,
  [AlarmQuality.CHANGING]: -1
};

export function useRules(props: AnyProps): AnyProps {
  const newProps: AnyProps = { ...props };
  const rules = props.rules === undefined ? [] : props.rules;
  const allPvs: string[] = [];
  const allTypes: SubscriptionType[] = [];
  let pvNotConnected = false;
  for (const rule of rules) {
    for (const pv of rule.pvs) {
      allPvs.push(pvQualifiedName(pv.pvName));
      allTypes.push({ string: true, double: true });
    }
  }
  // Subscribe to all PVs.
  useSubscription(props.id, allPvs, allTypes);
  // Get results from all PVs.
  const results = useSelector(
    (state): PvArrayResults => selectPvStates(state, allPvs),
    pvStateComparator
  );

  for (const rule of rules) {
    const { name, pvs, prop, outExp, expressions } = rule;
    const pvVars: { [pvName: string]: number | string | undefined } = {};
    for (let i = 0; i < pvs.length; i++) {
      // Set up variables that might be used.
      const pvState = results[pvQualifiedName(pvs[i].pvName)][0];
      if (!pvState?.connected) {
        log.debug(`Rule ${name}: pv ${pvs[i].pvName} not connected`);
        pvNotConnected = true;
      }
      const val = pvState?.value;
      let value = undefined;
      let doubleValue = undefined;
      let intValue = undefined;
      let stringValue = undefined;
      let severity = undefined;
      if (val) {
        doubleValue = dTypeGetDoubleValue(val);
        intValue =
          doubleValue === undefined ? undefined : Math.round(doubleValue);
        stringValue = dTypeCoerceString(val);
        value = doubleValue ?? stringValue;
        severity = INT_SEVERITIES[dTypeGetAlarm(val)?.quality || 0];
      }

      pvVars["pv" + i] = value;
      pvVars["pvStr" + i] = stringValue;
      pvVars["pvInt" + i] = intValue;
      pvVars["pvSev" + i] = severity;
    }

    try {
      for (const exp of expressions) {
        log.debug(`Evaluating expression ${exp.boolExp}`);
        log.debug(`Keys ${Object.keys(pvVars)}`);
        log.debug(`Values ${Object.values(pvVars)}`);
        // eslint-disable-next-line no-new-func
        const f = Function(...Object.keys(pvVars), "return " + exp.boolExp);
        // Evaluate the expression.
        const result = f(...Object.values(pvVars));
        log.debug(`result ${result}`);
        if (result) {
          // Not 'output expression': set the prop to the provided value.
          log.debug("Expression matched");
          if (!outExp) {
            switch (prop) {
              case "border_width":
                if (newProps.border) {
                  newProps["border"]["width"] = Number(exp.value._text);
                } else {
                  newProps.border = newBorder(
                    BorderStyle.None,
                    ColorUtils.BLACK,
                    Number(exp.value._text)
                  );
                }
                break;
              case "border_color":
                if (newProps.border) {
                  newProps["border"]["color"] = opiParseColor(exp.value);
                } else {
                  newProps.border = newBorder(
                    BorderStyle.None,
                    opiParseColor(exp.value),
                    0
                  );
                }
                break;
              case "x":
                newProps["position"]["x"] = `${exp.value._text}px`;
                break;
              case "y":
                newProps["position"]["y"] = `${exp.value._text}px`;
                break;
              case "file":
                newProps["file"]["path"] = exp?.convertedValue?.path;
                break;
              default:
                const match = parseArrayString(prop);
                if (match) {
                  const [prefix, index] = match;
                  const prop = newProps[prefix];
                  if (Array.isArray(prop) && prop.length > index) {
                    (prop as Array<any>)[index] = exp.convertedValue;
                  }
                } else {
                  newProps[prop] = exp.convertedValue;
                }
            }
            log.debug("Output value");
            log.debug(newProps);
          } else {
            // 'Output expression' - evaluate 'value' and set the prop to the result.
            const expression = "return " + (exp.convertedValue ?? exp.value);
            log.debug(`Output expression ${expression}`);
            // eslint-disable-next-line no-new-func
            const f = Function(...Object.keys(pvVars), expression);
            newProps[prop] = f(...Object.values(pvVars));
          }
          log.debug("Props after rule evaluation:");
          log.debug(newProps);
          break;
        } else {
          log.debug("Expression did not match");
        }
      }
      // If any PV does not connect, add a disconnected border.
      if (pvNotConnected) {
        newProps.border = newBorder(
          BorderStyle.Dotted,
          ColorUtils.DISCONNECTED,
          3
        );
      }
    } catch (error) {
      log.warn(`Failed to evaluate rule ${name}: ${error}`);
    }
  }
  return newProps;
}
