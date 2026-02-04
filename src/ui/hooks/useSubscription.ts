import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { DType } from "../../types/dtypes";
import { SubscriptionType } from "../../connection/plugin";
import { store } from "../../redux/store";
import {
  subscribe,
  unsubscribe,
  writePv as writePvAction
} from "../../redux/csState";

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
      dispatch(subscribe({ componentId, pvName, type }));
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
