import { MacroMap } from "../../types/macros";
import { WidgetDescription } from "../../ui/widgets/createComponent";
import { resolveAndNormaliseWidgetPaths } from "../../ui/widgets/EmbeddedDisplay/parserPatcherUtils";

/**
 * Recursively resolves and normalizes all path-related attributes within a widget tree.
 *
 * This function:
 * - Merges macros defined on the widget with those inherited from the parent context
 * - Applies macro substitution to all path values
 * - Resolves relative paths against the provided file path and converts them to absolute paths
 * - Traverses and updates all nested child widgets and tab children
 *
 * Note: This function mutates the provided widget description and its descendants.
 * It should be called after parsing, as macro values may influence the appearance of
 * the display, as well as the resolved paths and macros of any nested sub-displays.
 *
 * @param widgetDescription - The widget to process and mutate.
 * @param filepath - The absolute file path used as the base for resolving relative paths.
 * @param macros - Optional macros inherited from the parent context.
 * @returns The same widget description instance with all paths resolved and normalized.
 */
export const resolveWidgetPathsAndMacros = (
  widgetDescription: WidgetDescription,
  filepath?: string,
  macros?: MacroMap
): WidgetDescription => {
  const combinedMacros = {
    ...(macros ?? {}),
    ...(widgetDescription?.macros ?? {})
  };

  // Patch the paths in this widget
  widgetDescription = resolveAndNormaliseWidgetPaths(
    widgetDescription,
    filepath,
    combinedMacros
  );

  // Recursively patch the child widgets
  if (widgetDescription.children) {
    widgetDescription.children = widgetDescription.children.map(
      (child: any) => {
        return resolveWidgetPathsAndMacros(child, filepath, combinedMacros);
      }
    );
  }

  // Recursively patch the child tabs
  if (widgetDescription.tab) {
    widgetDescription.tab = widgetDescription.tab.map((child: any) => {
      return resolveWidgetPathsAndMacros(child, filepath, combinedMacros);
    });
  }

  return widgetDescription;
};

/**
 * Iterate over widget children and removed named widget
 * @param children array of widget descriptions
 * @param widgetId string id of widget to remove
 * @returns array of widget descriptions, with named widget removed
 */
export const deleteWidgetById = (
  children: WidgetDescription[] | undefined,
  widgetId: string
): WidgetDescription[] | undefined => {
  if (!children) {
    return children;
  }
  // Iterate over and filter out matching id
  return children
    .filter(child => child.id !== widgetId)
    .map(child => ({
      ...child,
      children: deleteWidgetById(child.children, widgetId)
    }));
};
