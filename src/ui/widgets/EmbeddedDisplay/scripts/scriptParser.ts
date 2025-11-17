import { ElementCompact } from "xml-js";
import { Script } from "../../../../types/props";
import { toArray } from "../parser";
import { opiParsePvName } from "../opiParser";

/**
 * Returns a script object array from a json element
 * @param jsonProp The json describing the array of script objects
 * @param defaultProtocol The default protocol eg ca (channel access)
 * @param isOpiFile true if this is an OPI file, false otherwise.
 */
export const scriptParser = (
  jsonProp: ElementCompact,
  defaultProtocol: string,
  isOpiFile: boolean
): Script[] => {
  if (!jsonProp.scripts) {
    return [];
  } else {
    const scriptsArray = toArray(jsonProp.scripts);

    return scriptsArray.map((element: ElementCompact): Script => {
      const script = element?.script;

      const file = script?._attributes?.file as string;
      const text = (script?.text?._cdata ??
        script?.text?._text ??
        "") as string;

      const pvArray = toArray(isOpiFile ? script?.pv : script?.pv_name);
      const pvs = pvArray.map((pv: ElementCompact) => {
        return {
          pvName: opiParsePvName(pv, defaultProtocol),
          trigger: isOpiFile ? pv._attributes?.trig === "true" : true
        };
      });

      return {
        file: file,
        text: text,
        pvs: pvs
      } as Script;
    });
  }
};
