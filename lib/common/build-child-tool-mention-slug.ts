import { buildPrefixedToolName } from "./build-prefixed-tool-name";

/** Runtime system-prompt slug for a child tool — the prefixed LangChain tool name. */
export function buildChildToolMentionSlug(
  parentSlug: string,
  childName: string,
): string {
  return buildPrefixedToolName(parentSlug, childName);
}

/** `@` mention label for a child tool in the prompt editor. */
export function buildChildToolMentionName(
  parentName: string,
  childName: string,
): string {
  return `${parentName} (${childName})`;
}
