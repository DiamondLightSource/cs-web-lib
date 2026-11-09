import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DType } from "../../types/dtypes";
import { SubscriptionType } from "../../connection/plugin";
import { store } from "../../redux/store";
import {
  subscribeBatch,
  SubscribePayload,
  unsubscribe,
  writePv as writePvAction
} from "../../redux/csState";

// Subscribe actions from one React commit are sent as one batch, so a screen of N widgets
// mounts with one dispatch instead of N (each of which runs every mounted selector).
let pending: SubscribePayload[] = [];
let flushDispatch: ((a: any) => void) | null = null;
function queueSubscribe(dispatch: (a: any) => void, p: SubscribePayload) {
  pending.push(p);
  if (!flushDispatch) {
    flushDispatch = dispatch;
    const flush = dispatch;
    queueMicrotask(() => {
      const batch = pending;
      pending = [];
      flushDispatch = null;
      flush(subscribeBatch(batch));
    });
  }
}

export function useSubscription(
  componentId: string,
  pvNames: string[],
  types: SubscriptionType[]
): void {
  // zip pvNames and types together
  const pvsAndTypes: [string, SubscriptionType][] = pvNames.map(
    (pvName: string, i: number) => {
      return [pvName, types[i]];
    }
  );
  const dispatch = useDispatch();
  // Get a repeatable value for React to decide whether to re-render.
  // If you put pvNames into the useEffect dependency array it will
  // not compare as equal to the last array, even with the same contents.
  const arrayStr = JSON.stringify(pvNames);
  // useEffect takes a function that
  // - takes no arguments and
  // - returns a function that takes no arguments and returns nothing
  useEffect((): (() => void) => {
    pvsAndTypes.forEach(([pvName, type]): void => {
      queueSubscribe(dispatch, { componentId, pvName, type });
    });
    return (): void => {
      pvNames.forEach((pvName): void => {
        dispatch(unsubscribe({ componentId, pvName }));
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, componentId, arrayStr]);
}

export function writePv(pvName: string, value: DType): void {
  store().dispatch(writePvAction({ pvName: pvName, value: value }));
}
