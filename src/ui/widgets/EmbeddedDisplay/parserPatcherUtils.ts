import log from "loglevel";
import { normalisePath, isFullyQualifiedUrl } from "../../../misc/urlUtils";
import { MacroMap } from "../../../types/macros";
import { WidgetDescription } from "../createComponent";

/**
 * Mutates the path-related attributes of a widget by resolving and applying
 * the provided macros to any paths it contains.
 *
 * Since macro values may differ between files, this transformation must be
 * performed after the widget has been fully parsed.
 *
 * In addition to macro substitution, any relative paths are resolved against
 * the parent directory and converted to absolute paths.
 *
 * @param widgetDescription - The widget description object to update.
 * @param parentDir - The absolute URL or file system path of the parent directory,
 * used as the base for resolving relative paths.
 * @param macros - A key-value map of macros to substitute into path values.
 * @returns The updated widget description with macros resolved and all paths normalized to absolute.
 */
export const resolveAndNormaliseWidgetPaths = (
  widgetDescription: WidgetDescription,
  parentDir?: string,
  macros?: MacroMap
): WidgetDescription => {
  log.debug(`resolveAndNormaliseWidgetPaths ${parentDir}`);

  if (
    widgetDescription["file"] &&
    parentDir &&
    !isFullyQualifiedUrl(widgetDescription["file"].path)
  ) {
    widgetDescription["file"].path = normalisePath(
      widgetDescription["file"].path,
      parentDir,
      macros
    );
    log.debug(`Corrected opi file to ${widgetDescription["file"].path}`);
  }
  // imageFile and image: just strings
  for (const prop of ["imageFile", "image"]) {
    // If image over http do not manipulate path.
    if (isFullyQualifiedUrl(widgetDescription[prop])) {
      continue;
    }
    if (widgetDescription[prop]) {
      widgetDescription[prop] = normalisePath(
        widgetDescription[prop],
        parentDir,
        macros
      );
      log.debug(`Corrected image file to ${widgetDescription.imageFile}`);
    }
  }
  // action.file: OpiFile type
  if (widgetDescription.actions && parentDir) {
    for (const action of widgetDescription.actions.actions) {
      if (action.dynamicInfo) {
        action.dynamicInfo.file.path = normalisePath(
          action.dynamicInfo.file.path,
          parentDir,
          macros
        );
        log.debug(`Corrected path to ${action.dynamicInfo.file.path}`);
      }
    }
  }

  // symbols: list of string file paths
  if (widgetDescription["symbols"] && parentDir) {
    widgetDescription["symbols"] = widgetDescription["symbols"].map(
      (symbol: string) => {
        if (isFullyQualifiedUrl(symbol)) return symbol;
        return normalisePath(symbol, parentDir, macros);
      }
    );
    // For the case where a symbol contains a rule that updates a symbol path
    widgetDescription["rules"]
      ?.filter((rule: any) => rule?.prop?.startsWith("symbols["))
      ?.forEach((rule: any) => {
        rule?.expressions
          ?.filter((expression: any) => expression.convertedValue)
          ?.forEach((expression: any) => {
            expression.convertedValue = normalisePath(
              expression.convertedValue,
              parentDir,
              macros
            );
          });
      });
  }

  // case where a rule contains a file
  if (widgetDescription["rules"] && parentDir) {
    widgetDescription["rules"]
      ?.filter((rule: any) => rule?.prop?.startsWith("file"))
      ?.forEach((rule: any) => {
        rule?.expressions
          ?.filter((expression: any) => expression?.convertedValue?.path)
          ?.forEach((expression: any) => {
            expression.convertedValue.path = normalisePath(
              expression.convertedValue.path,
              parentDir,
              macros
            );
          });
      });
  }

  // When a tab widget contains a file
  if (widgetDescription["tabs"] && parentDir) {
    widgetDescription["tabs"].forEach((tab: any) => {
      if (isFullyQualifiedUrl(tab.file)) return;
      tab.file = normalisePath(tab.file, parentDir, macros);
    });
  }

  return widgetDescription;
};
