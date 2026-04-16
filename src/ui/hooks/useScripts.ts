import log from "loglevel";

import { useSubscription } from "./useSubscription";
import { useSelector } from "react-redux";
import {
  selectPvStates,
  pvStateComparator,
  PvArrayResults
} from "../../redux/csState";

import { dTypeCoerceString, dTypeGetDoubleValue } from "../../types/dtypes";
import { SubscriptionType } from "../../connection/plugin";
import {
  executeDynamicScriptInSandbox,
  ScriptResponse
} from "../widgets/EmbeddedDisplay/scripts/scriptExecutor";
import { Script } from "../../types/props";
import { pvQualifiedName } from "../../types/pv";
import { selectEnableDynamicScripts } from "../../redux/slices/configurationSlice";
import { useEffect, useMemo } from "react";

export const useScripts = (
  scriptsProp: Script[],
  widgetId: string,
  callback: (scriptResponse: ScriptResponse) => void
) => {
  const scripts = useMemo(() => scriptsProp ?? [], [scriptsProp]);

  const allPvs: string[] = [];
  const allTypes: SubscriptionType[] = [];

  for (const script of scripts) {
    for (const pvMetadata of script.pvs) {
      allPvs.push(pvQualifiedName(pvMetadata.pvName));
      allTypes.push({ string: true, double: true });
    }
  }

  // Subscribe to all PVs.
  useSubscription(widgetId, allPvs, allTypes);

  // Get results from all PVs.
  const pvDataMap = useSelector(
    (state): PvArrayResults => selectPvStates(state, allPvs),
    pvStateComparator
  );

  const enableDynamicScripts = useSelector(selectEnableDynamicScripts);
  const hasScripts = !!scripts?.length;

  useEffect(() => {
    if (!enableDynamicScripts && hasScripts) {
      log.warn(
        "Dynamic script loading is disabled by default. " +
          "Enable it with the `enableDynamicScripts` feature flag.\n" +
          "Dynamic scripts may introduce security risks, " +
          "ensure all script sources are trusted."
      );
    }
  }, [enableDynamicScripts, hasScripts]);

  useEffect(() => {
    if (!enableDynamicScripts || !scripts.length) {
      return;
    }
    let cancelled = false;

    const runScript = async (script: Script) => {
      const pvValues = script.pvs.map(pvMetadata => {
        const pvDatum = pvDataMap[pvQualifiedName(pvMetadata.pvName)]?.[0];

        if (!pvDatum?.value) {
          return { number: undefined, string: undefined };
        }

        return {
          number: dTypeGetDoubleValue(pvDatum.value),
          string: dTypeCoerceString(pvDatum.value)
        };
      });

      try {
        const result = await executeDynamicScriptInSandbox(
          script.text,
          pvValues
        );

        if (!cancelled) {
          callback(result);
        }
      } catch (err) {
        if (!cancelled) {
          log.warn(err);
        }
      }
    };

    scripts.forEach(runScript);

    return () => {
      cancelled = true;
    };
  }, [scripts, pvDataMap, enableDynamicScripts, callback]);
};
