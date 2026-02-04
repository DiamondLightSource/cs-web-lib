import { useSelector, useDispatch } from "react-redux";
import { CsState, queryDevice } from "../../redux/csState";
import { deviceSelector, deviceComparator } from "./utils";
import { DType } from "../../types/dtypes";
import { useEffect } from "react";

export function useDevice(device: string): DType | undefined {
  const dispatch = useDispatch();

  useEffect((): void => {
    dispatch(queryDevice({ device }));
  }, [dispatch, device]);

  const description: DType | undefined = useSelector<CsState, DType>(
    (state: CsState): DType => deviceSelector(device, state),
    deviceComparator
  );
  return description;
}
