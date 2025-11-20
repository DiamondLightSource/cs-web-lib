import log from "loglevel";

import { useSubscription } from "./useSubscription";
import { useSelector } from "react-redux";
import { CsState } from "../../redux/csState";

import { PvArrayResults, pvStateSelector, pvStateComparator } from "./utils";
import { DType } from "../../types/dtypes";
import { SubscriptionType } from "../../connection/plugin";
import {
  executeDynamicScriptInSandbox,
  ScriptResponse
} from "../widgets/EmbeddedDisplay/scripts/scriptExecutor";
import { Script } from "../../types/props";

export function useScripts(
  scriptsProp: Script[],
  widgetId: string,
  callback: (scriptResponse: ScriptResponse) => void
) {
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
    const pvValues: (number | string | undefined)[] = [];
    for (const pvMetadata of pvMetadataList) {
      const pvDatum = pvDataMap[pvMetadata.pvName.qualifiedName()][0];

      let value = undefined;

      if (pvDatum?.value) {
        const doubleValue = pvDatum.value.getDoubleValue();
        const stringValue = DType.coerceString(pvDatum.value);
        value = doubleValue ?? stringValue;
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
        log.error(reason);
      });
  }
}
