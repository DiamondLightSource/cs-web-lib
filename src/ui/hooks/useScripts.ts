import log from "loglevel";

import { useSubscription } from "./useSubscription";
import { useSelector } from "react-redux";
import { CsState } from "../../redux/csState";

import { PvArrayResults, pvStateSelector, pvStateComparator } from "./utils";
import {
  dTypeCoerceString,
  dTypeGetDoubleValue
} from "../../types/dtypes/dType";
import { SubscriptionType } from "../../connection/plugin";
import {
  executeDynamicScriptInSandbox,
  ScriptResponse
} from "../widgets/EmbeddedDisplay/scripts/scriptExecutor";
import { Script } from "../../types/props";

export const useScripts = (
  scriptsProp: Script[],
  widgetId: string,
  callback: (scriptResponse: ScriptResponse) => void
) => {
  const scripts = scriptsProp ?? [];
  const allPvs: string[] = [];
  const allTypes: SubscriptionType[] = [];

  for (const script of scripts) {
    for (const pvMetadata of script.pvs) {
      allPvs.push(pvMetadata.pvName.qualifiedName());
      allTypes.push({ string: true, double: true });
    }
  }

  // Subscribe to all PVs.
  useSubscription(widgetId, allPvs, allTypes);

  // Get results from all PVs.
  const pvDataMap = useSelector(
    (state: CsState): PvArrayResults => pvStateSelector(allPvs, state),
    pvStateComparator
  );

  for (const script of scripts) {
    const { pvs: pvMetadataList } = script;

    // Build array of pv values
    const pvValues: {
      number: number | undefined;
      string: string | undefined;
    }[] = [];
    for (const pvMetadata of pvMetadataList) {
      const pvDatum = pvDataMap[pvMetadata.pvName.qualifiedName()][0];

      let value: { number: number | undefined; string: string | undefined } = {
        number: undefined,
        string: undefined
      };

      if (pvDatum?.value) {
        const doubleValue = dTypeGetDoubleValue(pvDatum.value);
        const stringValue = dTypeCoerceString(pvDatum.value);
        value = { number: doubleValue, string: stringValue };
      }
      pvValues.push(value);
    }

    log.debug(`Executing script:\n ${script.text}`);
    log.debug(`PV values ${pvValues}`);

    executeDynamicScriptInSandbox(script.text, pvValues)
      .then(result => {
        log.debug(`Script completed execution`);
        log.debug(result);
        callback(result);
      })
      .catch(reason => {
        log.warn(reason);
      });
  }
};
