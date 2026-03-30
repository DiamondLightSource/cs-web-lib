/* eslint no-template-curly-in-string: 0 */
import React from "react";
import { resolveActionsMacro, resolveRulesMacro, useMacros } from "./useMacros";
import { newPV, pvQualifiedName } from "../../types/pv";
import { contextRender, createRootStoreState } from "../../testResources";
import { CsState } from "../../redux/csState";
import { WidgetActions } from "../widgets/widgetActions";
import { Rule } from "../../types/props";

/* Use one of the techniques described here for testing hooks without
  excessive mocking.
  https://kentcdodds.com/blog/how-to-test-custom-react-hooks
*/
export function substituteMacros(
  props: Record<string, unknown>,
  initialRootState = buildInitialCsState(),
  initialContextMacros: { [key: string]: any } = {}
): any {
  let resolvedProps = {};
  function MacrosTester(): JSX.Element {
    resolvedProps = useMacros(props);
    return <div></div>;
  }
  contextRender(
    <MacrosTester />,
    undefined,
    undefined,
    createRootStoreState(initialRootState),
    initialContextMacros
  );
  return resolvedProps;
}

const buildInitialCsState = (): CsState => ({
  effectivePvNameMap: {},
  globalMacros: {},
  subscriptions: {},
  valueCache: {},
  deviceCache: {},
  fileCache: {},
  pvwsSettings: {}
});

const actionsProp = {
  executeAsOne: false,
  actions: [
    {
      type: "WRITE_PV",
      writePvInfo: {
        pvName: "${c}:SUFFIX",
        value: 1
      }
    },
    {
      type: "WRITE_PV",
      writePvInfo: {
        pvName: "$(pv_name)",
        value: 1
      }
    }
  ]
};

describe("useMacros", (): void => {
  it("resolves display macros", (): void => {
    const props = { prop: "${a}b" };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.prop).toEqual("Ab");
  });
  it("handles nested macros", (): void => {
    // ${e} is ${a}, which in turn is A.
    const props = { prop: "${e}b" };
    const resolvedProps = substituteMacros(props);

    expect(resolvedProps.prop).toEqual("Ab");
  });
  it("resolves global macros", (): void => {
    const props = { prop: "${d}b" };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.prop).toEqual("Eb");
  });
  it("prioritises display macros over global macros", (): void => {
    const props = { prop: "${c}b" };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.prop).toEqual("Cb");
  });
  it("does not modify props", (): void => {
    const props = { prop: "${a}b" };
    substituteMacros(props);
    expect(props.prop).toEqual("${a}b");
  });
  it("does not resolve missing macros in object", (): void => {
    const props = { prop: "${z}b" };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.prop).toEqual("${z}b");
  });
  it("changes parentheses in missing macro to braces", (): void => {
    const props = { prop: "$(z)b" };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.prop).toEqual("${z}b");
  });
  it("resolves macros in nested object", (): void => {
    const props = { prop: { subprop: "${b}b" } };
    // Use any type as prop.subprop is not actually a valid prop
    // and useMacros returns AnyProps.
    const resolvedProps: any = substituteMacros(props);
    expect(resolvedProps.prop.subprop).toEqual("Bb");
  });
  it("resolves macros in actions", (): void => {
    const props = {
      pvMetadataList: [{ pvName: newPV("hello", "loc") }],
      actions: actionsProp
    };
    const resolvedProps = substituteMacros(props);
    const action1: any = resolvedProps?.actions?.actions[0];
    expect(action1.writePvInfo.pvName).toEqual("C:SUFFIX");
    const action2: any = resolvedProps?.actions?.actions[1];
    // Note loc:// prefix is missed here.
    expect(action2.writePvInfo.pvName).toEqual("loc://hello");
  });
  it("resolves macros in PV object", (): void => {
    const props = { pvMetadataList: [{ pvName: newPV("PREFIX:${c}", "xxx") }] };
    const resolvedProps = substituteMacros(props);
    expect(pvQualifiedName(resolvedProps?.pvMetadataList[0].pvName)).toEqual(
      "xxx://PREFIX:C"
    );
  });
  it("returns empty array for empty array", (): void => {
    const props = { arrayProp: [] };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.arrayProp).toEqual([]);
  });
  it("handles macros in arrays", (): void => {
    const props = { arrayProp: ["${c}b", "${z}b"] };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.arrayProp).toEqual(["Cb", "${z}b"]);
  });
  it("handles macros in arrays of objects", (): void => {
    const props = {
      arrayProp: ["${z}b", { key: "${c}D" }]
    };
    const resolvedProps = substituteMacros(props);
    expect(resolvedProps.arrayProp).toEqual(["${z}b", { key: "CD" }]);
  });
  it("handles global macros called pv_name and pvname", (): void => {
    const csStage = buildInitialCsState();
    csStage.globalMacros = { pv_name: "the_pv_name", pvname: "thePvName" };

    const props = {
      prop1: "${pv_name}_b",
      prop2: "${pvname}_D"
    };

    const resolvedProps = substituteMacros(props, csStage);
    expect(resolvedProps.prop1).toEqual("the_pv_name_b");
    expect(resolvedProps.prop2).toEqual("thePvName_D");
  });

  it("handles context macros called pv_name and pvname", (): void => {
    const contextMacros = { pv_name: "the_pv_name", pvname: "thePvName" };

    const props = {
      prop1: "${pv_name}_b",
      prop2: "${pvname}_D"
    };

    const resolvedProps = substituteMacros(props, undefined, contextMacros);
    expect(resolvedProps.prop1).toEqual("the_pv_name_b");
    expect(resolvedProps.prop2).toEqual("thePvName_D");
  });
});

describe("resolveActionsMacro()", (): void => {
  it("resolves for no actions", (): void => {
    const props = { actions: { actions: [], executeAsOne: false } };
    const resolvedText = resolveActionsMacro(props.actions, true);
    expect(resolvedText).toEqual("No actions");
  });
  it("resolves for 1 action", (): void => {
    const props = {
      executeAsOne: false,
      actions: [
        {
          type: "WRITE_PV",
          writePvInfo: {
            pvName: "${c}:SUFFIX",
            value: 1,
            description: "Action description"
          }
        }
      ]
    };
    const resolvedText = resolveActionsMacro(props as WidgetActions, true);
    expect(resolvedText).toEqual("Action description");
  });
  it("resolves for multiple actions executed at once", (): void => {
    const props = { ...actionsProp, executeAsOne: true };
    const resolvedText = resolveActionsMacro(props as WidgetActions, true);
    expect(resolvedText).toEqual("2 actions");
  });
  it("resolves for multiple actions on a non-action button widget", (): void => {
    const resolvedText = resolveActionsMacro(
      actionsProp as WidgetActions,
      false
    );
    expect(resolvedText).toEqual("2 actions");
  });
  it("resolves for multiple individually executed actions", (): void => {
    const resolvedText = resolveActionsMacro(
      actionsProp as WidgetActions,
      true
    );
    expect(resolvedText).toEqual("Choose 1 of 2");
  });
});

describe("resolveRulesMacro()", (): void => {
  it("resolves empty for no rules", (): void => {
    const rules: Rule[] = [];
    const resolvedText = resolveRulesMacro(rules);
    expect(resolvedText).toEqual("");
  });
  it("resolves correctly for a rule", (): void => {
    const rules: Rule[] = [
      {
        name: "rule",
        prop: "text",
        outExp: false,
        pvs: [{ pvName: newPV("PV1"), trigger: true }],
        expressions: [
          {
            boolExp: "pv0 > 1",
            value: "yes",
            convertedValue: "yes"
          },
          {
            boolExp: "true",
            value: "no",
            convertedValue: "no"
          }
        ]
      }
    ];
    const resolvedText = resolveRulesMacro(rules);
    expect(resolvedText).toEqual(
      "RuleInfo('rule: [(pv0 > 1) ? 'text' = yes,(true) ? 'text' = no]', [PV 'PV1'])"
    );
  });
});
