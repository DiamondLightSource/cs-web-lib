import { useDispatch, useSelector } from "react-redux";
import {
  createDisplayInstanceFromQuickScreen,
  selectDisplayInstance
} from "../../redux/slices/fileCacheSlice";
import { MacroMap } from "../../types/macros";
import { WidgetDescription } from "../widgets/createComponent";

export const useDisplayInstance = (uuid: string) => {
  const dispatch = useDispatch();

  const displayInstance = useSelector(state =>
    selectDisplayInstance(state, uuid)
  );

  const addDisplayInstanceByDescription = (
    file: string,
    macros: MacroMap,
    description: WidgetDescription
  ) => {
    dispatch(
      createDisplayInstanceFromQuickScreen({
        name: file,
        macros,
        content: description
      })
    );
  };

  return {
    displayInstance,
    addDisplayInstanceByDescription
  };
};
