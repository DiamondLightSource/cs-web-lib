import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { MacroMap, resolveMacros, MacroContext } from "../../types/macros";
import { selectGlobalMacros } from "../../redux/csState";
import { pvQualifiedName } from "../../types/pv";
import { AnyProps } from "../widgets/widgetProps";
import { getActionDescription, WidgetActions } from "../widgets/widgetActions";
import { Rule } from "../../types/props";

export interface MacroProps extends React.PropsWithChildren<any> {
  macroMap?: MacroMap;
}

/**
 * Creates the correct string to substitute for
 * the $(actions) macro
 * @param actions array of available actions on widget
 * @param isActionButton whether the actions are called on the
 * actionbutton widget
 * @returns
 */
export function resolveActionsMacro(
  actions: WidgetActions,
  isActionButton?: boolean
): string {
  if (!actions) return "No actions";
  if (actions.actions.length > 1) {
    // Only actionbutton can execute components individually
    if (actions.executeAsOne || !isActionButton)
      return `${actions.actions.length} actions`;
    return `Choose 1 of ${actions.actions.length}`;
  } else if (actions.actions.length === 1) {
    return getActionDescription(actions.actions[0]);
  } else {
    return "No actions";
  }
}

/**
 * Creates a human-readable string to substitute for the
 * $(rules) macro
 * @param rules list of rules on widget
 * @returns human-readable string of rules
 */
export function resolveRulesMacro(rules: Rule[] | undefined): string {
  if (!rules) return "";
  const rulesList = rules.map((rule: Rule) => {
    return `RuleInfo('${rule.name}: [${rule.expressions.map(
      (expression: any) => {
        return `(${expression.boolExp}) ? '${rule.prop}' = ${expression.value?._text || expression.value}`;
      }
    )}]', [${rule.pvs.map(pv => {
      return `PV '${pv.pvName.name}'`;
    })}])`;
  });
  return rulesList.join(",");
}

/*
 * Return a copy of the props object with resolved macros, recursing
 * into any arrays and objects.
 * Do not descend into child components as this is called for each widget.
 */
export function recursiveResolve(
  props: MacroProps,
  macroMap: MacroMap
): AnyProps {
  // Shallow clone of props object with the same prototype. This is
  // important for when a prop object is an ES6 class e.g. Font or Color.
  const resolvedProps = Object.assign(
    Object.create(Object.getPrototypeOf(props)),
    props
  );
  // Allow substitutions of the widget's props as well as macros.
  macroMap = { ...props, ...macroMap };
  for (const [prop, value] of Object.entries(props)) {
    // Don't descend into child components.
    if (prop === "children") {
      resolvedProps[prop] = value;
    } else {
      if (typeof value === "object") {
        if (Array.isArray(value)) {
          const newArray = value.map((member: any): any => {
            if (typeof member === "object") {
              return recursiveResolve(member, macroMap);
            } else if (typeof member === "string") {
              return resolveMacros(member, macroMap);
            }
            return member;
          });
          resolvedProps[prop] = newArray;
        } else {
          resolvedProps[prop] = recursiveResolve(value, macroMap);
        }
      } else if (typeof value === "string") {
        const resolved = resolveMacros(value, macroMap);
        resolvedProps[prop] = resolved;
        // Store resolved string in macroMap to avoid
        // having to re-resolve later.
        macroMap[prop] = resolved;
      } else {
        resolvedProps[prop] = value;
      }
    }
  }
  return resolvedProps;
}

export function useMacros<P extends MacroProps>(props: P): AnyProps {
  const displayMacros = useContext(MacroContext).macros;
  const globalMacros = useSelector(selectGlobalMacros);
  // In Phoebus, some components e.g. Shape have a macros field
  const propMacros = props.macros;
  const pvName = props.pvMetadataList?.at(0)?.pvName;
  const allMacros = {
    ...globalMacros, // lower priority
    ...displayMacros, // higher priority
    // Temporary special case for pv_name in macros.
    // We convert it to a qualified name to match Phoebus
    pvName: pvName
      ? pvQualifiedName(pvName)
      : pvName || displayMacros.pvName || globalMacros.pvName || "",
    pv_name: pvName
      ? pvQualifiedName(pvName)
      : pvName || displayMacros.pv_name || globalMacros.pv_name || "",
    ...propMacros,
    actions: resolveActionsMacro(props.actions),
    rules: resolveRulesMacro(props.rules)
  };
  return recursiveResolve(props, allMacros);
}
