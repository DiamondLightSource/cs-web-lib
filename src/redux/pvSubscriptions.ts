import { Middleware } from "@reduxjs/toolkit";
import { useCallback, useRef, useSyncExternalStore } from "react";
import { useStore } from "react-redux";
import {
  connectionChanged,
  connectionClosed,
  CsState,
  PvArrayResults,
  pvStateComparator,
  subscribe,
  unsubscribe,
  valueChanged,
  valuesChanged
} from "./csState";

// Per-PV change notification: a hook reading PV state is told only about the PVs it reads,
// instead of re-running its selector on every dispatch.
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
// effective PV name -> the PV names widgets used for it, when they differ
const aliases = new Map<string, Set<string>>();

function subscribePvs(pvNames: string[], listener: Listener): () => void {
  for (const pv of pvNames) {
    let set = listeners.get(pv);
    if (!set) {
      set = new Set();
      listeners.set(pv, set);
    }
    set.add(listener);
  }
  return () => {
    for (const pv of pvNames) {
      const set = listeners.get(pv);
      set?.delete(listener);
      if (set?.size === 0) {
        listeners.delete(pv);
      }
    }
  };
}

function notify(pvNames: Iterable<string>): void {
  const toCall = new Set<Listener>();
  const add = (pv: string) => listeners.get(pv)?.forEach(l => toCall.add(l));
  for (const pv of pvNames) {
    add(pv);
    aliases.get(pv)?.forEach(add);
  }
  toCall.forEach(l => l());
}

export const pvNotifyMiddleware: Middleware = () => next => action => {
  const result = next(action);
  if (valuesChanged.match(action)) {
    notify(new Set(action.payload.map(a => a.payload.pvName)));
  } else if (
    valueChanged.match(action) ||
    connectionChanged.match(action) ||
    connectionClosed.match(action) ||
    unsubscribe.match(action)
  ) {
    notify([action.payload.pvName]);
  } else if (subscribe.match(action)) {
    const { pvName, effectivePvName } = action.payload;
    if (effectivePvName && effectivePvName !== pvName) {
      let set = aliases.get(effectivePvName);
      if (!set) {
        set = new Set();
        aliases.set(effectivePvName, set);
      }
      set.add(pvName);
    }
    notify([pvName]);
  }
  return result;
};

function pvStatesOf(state: CsState, pvNames: string[]): PvArrayResults {
  const results: PvArrayResults = {};
  for (const pvName of pvNames) {
    const effectivePvName = state.effectivePvNameMap[pvName] || pvName;
    results[pvName] = [state.valueCache[effectivePvName], effectivePvName];
  }
  return results;
}

/* The PV states of pvNames, re-rendering only when one of them changes. */
export function usePvStates(pvNames: string[]): PvArrayResults {
  const store = useStore();
  const key = pvNames.join("\u0000");
  const cache = useRef<{ key: string; results: PvArrayResults } | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sub = useCallback((l: Listener) => subscribePvs(pvNames, l), [key]);
  const getSnapshot = () => {
    const results = pvStatesOf((store.getState() as any).cs, pvNames);
    const c = cache.current;
    if (c && c.key === key && pvStateComparator(c.results, results)) {
      return c.results;
    }
    cache.current = { key, results };
    return results;
  };
  return useSyncExternalStore(sub, getSnapshot);
}
