import { useSelector } from "react-redux";
import { selectDisplayInstance } from "../../redux/slices/fileCacheSlice";

export const useDisplayInstance = (uuid: string) => {
  return useSelector(state => selectDisplayInstance(state, uuid));
};
