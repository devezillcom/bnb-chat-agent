import { SLUG_MAX_LENGTH, slugifyName } from "./slugify-name";

/** LangChain tool name for a child tool: `{parentSlug}__{childSlug}`. */
export function buildPrefixedToolName(
  parentSlug: string,
  childName: string,
): string {
  const childSlug = slugifyName(childName, "tool");
  const suffix = `__${childSlug}`;
  const maxParentLength = SLUG_MAX_LENGTH - suffix.length;

  if (maxParentLength <= 0) {
    return suffix.slice(0, SLUG_MAX_LENGTH);
  }

  return `${parentSlug.slice(0, maxParentLength)}${suffix}`;
}
