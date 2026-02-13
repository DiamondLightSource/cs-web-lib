import { useDispatch, useSelector } from "react-redux";
import {
  fileChanged,
  refreshFile as refreshFileAction,
  selectFile,
  fileComparator
} from "../../redux/csState";
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

const EMPTY_WIDGET: WidgetDescription = {
  type: "shape",
  position: newAbsolutePosition("0", "0", "0", "0")
};

export interface File {
  path: string;
  macros: MacroMap;
  defaultProtocol: string;
}

export async function fetchAndConvert(
  filepath: string,
  protocol: string,
  macros?: MacroMap
): Promise<WidgetDescription> {
  try {
    const parentDir = filepath.slice(0, filepath.lastIndexOf("/"));
    const fileResponse = await httpRequest(filepath);

    const fileExt = filepath.split(".").pop() || "json";
    const contents = await fileResponse.text();
    let description = EMPTY_WIDGET;

    // Hack!
    if (contents.startsWith("<!DOCTYPE html>")) {
      throw new Error("File not found");
    }
    if (contents !== "") {
      // Convert the contents to widget description style object
      switch (fileExt) {
        case "bob":
          description = await parseBob(contents, protocol, parentDir, macros);
          break;
        case "json":
          description = await parseJson(contents, protocol, parentDir);
          break;
        case "opi":
          description = await parseOpi(contents, protocol, parentDir);
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

export function useFile(file: File, macros?: MacroMap): WidgetDescription {
  const dispatch = useDispatch();
  const fileExt = file.path.split(".").pop() || "json";

  const contents = useSelector(
    (state): any => selectFile(state, file.path),
    fileComparator
  );

  useEffect(() => {
    let isMounted = true;
    const fetchData = async (): Promise<void> => {
      const fetchPromise = fetchAndConvert(
        file.path,
        file.defaultProtocol,
        macros
      );
      const contents = await fetchPromise;

      // Populate the file cache.
      if (isMounted) {
        dispatch(fileChanged({ file: file.path, contents: contents }));
      }
    };
    fetchData();

    // Tidy up in case component is unmounted
    return () => {
      isMounted = false;
    };
  }, [file.path, file.defaultProtocol, fileExt, contents, dispatch, macros]);

  return contents || EMPTY_WIDGET;
}

export function refreshFile(store: Store, file: string): void {
  store.dispatch(refreshFileAction({ file: file }));
}
