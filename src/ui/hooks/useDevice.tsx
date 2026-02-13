import { useSelector, useDispatch } from "react-redux";
import {
  queryDevice,
  selectDevice,
  deviceComparator
} from "../../redux/csState";
import { DType } from "../../types/dtypes";
import { useEffect } from "react";

export function useDevice(deviceId: string): DType | undefined {
  const dispatch = useDispatch();

  useEffect((): void => {
    dispatch(queryDevice({ device: deviceId }));
  }, [dispatch, deviceId]);

  return useSelector(
    (state): DType => selectDevice(state, deviceId),
    deviceComparator
  );
}
