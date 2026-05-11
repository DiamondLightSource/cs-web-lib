import React from "react";
import { useSubscription } from "./useSubscription";
import { useSelector } from "react-redux";
import {
  CsState,
  selectPvStates,
  pvStateComparator,
  PvArrayResults
} from "../../redux/csState";
import { SubscriptionType } from "../../connection/plugin";
import { DType } from "../../types/dtypes";

export interface PvProps extends React.PropsWithChildren<any> {
  pvName: string;
  effectivePvName: string;
}

export function useConnection(
  id: string,
  pvName?: string,
  type?: SubscriptionType
): [string, boolean, boolean, DType?] {
  const pvNameArray = pvName === undefined ? [] : [pvName];
  const typeArray = type === undefined ? [] : [type];
  useSubscription(id, pvNameArray, typeArray);
  const pvResults = useSelector(
    (state): PvArrayResults => selectPvStates(state, pvNameArray),
    pvStateComparator
  );
  let connected = false;
  let readonly = false;
  let value = undefined;
  let effectivePvName = "undefined";

  if (pvName !== undefined) {
    const [pvState, effPvName] = pvResults[pvName];
    effectivePvName = effPvName;
    if (pvState) {
      connected = pvState.connected || false;
      readonly = pvState.readonly || false;
      value = pvState.value;
    }
  }

  return [effectivePvName, connected, readonly, value];
}

export const useConnectionMultiplePv = (
  id: string,
  pvNames: string[],
  subscriptionType?: SubscriptionType,
  overridePvSubscriptionsCallback?: (pvNameArray: string[]) => {
    pvNameSubscriptions: string[];
    additionalPvData: PvArrayResults;
  }
) => {
  let pvNameArray = pvNames.filter(x => !!x);
  const typeArray = !subscriptionType ? [] : [subscriptionType];

  let additionalPvData: PvArrayResults = {};

  let pvNameSubscriptions = pvNameArray;
  if (overridePvSubscriptionsCallback) {
    // This provides a mechanism for widgets to override the standard pv subscription
    ({ pvNameSubscriptions, additionalPvData } =
      overridePvSubscriptionsCallback(pvNameArray));
    pvNameArray = [
      ...new Set([...pvNameArray, ...Object.keys(additionalPvData)])
    ];
  }

  useSubscription(id, pvNameSubscriptions, typeArray);
  const pvStates = useSelector(
    (state: CsState): PvArrayResults =>
      selectPvStates(state, pvNameSubscriptions),
    pvStateComparator
  );

  const pvResults = { ...pvStates, ...additionalPvData };

  return {
    pvData: pvNameArray
      .filter(pvName => pvName in pvResults)
      .map(pvName => {
        const [pvState, effPvName] = pvResults[pvName];

        return {
          effectivePvName: effPvName,
          connected: pvState?.connected ?? false,
          readonly: pvState?.readonly ?? false,
          value: pvState?.value
        };
      })
  };
};
