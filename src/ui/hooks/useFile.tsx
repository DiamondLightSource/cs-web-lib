import { useDispatch, useSelector } from "react-redux";
import {
  fileChanged,
  refreshFile as refreshFileAction,
  selectFile,
  fileComparator,
  selectDisplayInstanceByFileAndMacros,
  createDisplayInstanceFromFile
} from "../../redux/slices/fileCacheSlice";
import { MacroMap } from "../../types/macros";
import { errorWidget, WidgetDescription } from "../widgets/createComponent";
import { useEffect } from "react";
import { httpRequest } from "../../misc";
import log from "loglevel";
import { parseBob } from "../widgets/EmbeddedDisplay/bobParser";
import { parseJson } from "../widgets/EmbeddedDisplay/jsonParser";
import { parseOpi } from "../widgets/EmbeddedDisplay/opiParser";
import { Store } from "redux";
import { newAbsolutePosition } from "../../types/position";
import { parseBcf } from "../widgets/EmbeddedDisplay/bcfParser";

export const EMPTY_WIDGET_ID = "EMPTY_WIDGET";
export const EMPTY_WIDGET: WidgetDescription = {
  type: "shape",
  id: "EMPTY_WIDGET",
  fileId: "EMPTY_WIDGET",
  position: newAbsolutePosition("0", "0", "0", "0")
};

export interface File {
  path: string;
  macros: MacroMap;
  defaultProtocol: string;
}

export async function fetchAndConvert(
  filepath: string,
  protocol: string
): Promise<WidgetDescription> {
  try {
    const parentDir = filepath.slice(0, filepath.lastIndexOf("/"));
    const fileResponse = await httpRequest(filepath);

    const fileExt = filepath.split(".").pop() || "json";
    const contents = (await fileResponse?.text()) ?? "";
    let description = EMPTY_WIDGET;

    // Hack!
    if (contents?.startsWith("<!DOCTYPE html>")) {
      throw new Error("File not found");
    }
    if (contents !== "") {
      // Convert the contents to widget description style object
      switch (fileExt) {
        case "bob":
          description = await parseBob(contents, protocol, parentDir, filepath);
          break;
        case "bcf":
          description = await parseBcf(contents, protocol, filepath);
          break;
        case "json":
          description = await parseJson(contents, protocol, filepath);
          break;
        case "opi":
          description = await parseOpi(contents, protocol, filepath);
          break;
      }
    }
    return description;
  } catch (error) {
    const message = `Error parsing ${filepath}: ${error}.`;
    log.warn(message);
    log.warn(error);
    return errorWidget(message);
  }
}

export function useFile(
  file: File,
  macros?: MacroMap
): [WidgetDescription, string] {
  const dispatch = useDispatch();

  const displayInstance = useSelector(state =>
    selectDisplayInstanceByFileAndMacros(state, file.path, macros ?? {})
  );

  const fileContents = useSelector(
    (state): any => selectFile(state, file.path),
    fileComparator
  );

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const widgetDescription = await fetchAndConvert(
        file.path,
        file.defaultProtocol
      );

      // Populate the file cache.
      if (isMounted) {
        dispatch(fileChanged({ file: file.path, contents: widgetDescription }));
        dispatch(
          createDisplayInstanceFromFile({
            file: file.path,
            macros: macros ?? {}
          })
        );
      }
    };
    let isMounted = true;

    if (fileContents == null && displayInstance == null) {
      fetchData();
    } else if (displayInstance == null) {
      dispatch(
        createDisplayInstanceFromFile({ file: file.path, macros: macros ?? {} })
      );
    }

    // Tidy up in case component is unmounted
    return () => {
      isMounted = false;
    };
  }, [
    file.path,
    file.defaultProtocol,
    fileContents,
    dispatch,
    macros,
    displayInstance
  ]);

  return [
    displayInstance?.description || EMPTY_WIDGET,
    displayInstance?.uuid ?? "EMPTY_WIDGET"
  ];
}

export function refreshFile(store: Store, file: string): void {
  store.dispatch(refreshFileAction({ file: file }));
}
