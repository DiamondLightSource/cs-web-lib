import { WidgetDescription } from "../../ui/widgets/createComponent";

/**
 * Find an item in a tree by it's id.
 * @param tree The widget hierarchy
 * @param id The id of the widget to find.
 * @returns The matching widget description or undefined
 */

export const findWidgetById = (
  tree: WidgetDescription[] | undefined,
  id: string
): WidgetDescription | undefined => {
  if (!Array.isArray(tree)) return undefined;

  for (const node of tree) {
    if (!node || typeof node !== "object") continue;

    if (node.id === id) return node;

    const found = findWidgetById(node.children, id);
    if (found) return found;
  }

  return undefined;
};
