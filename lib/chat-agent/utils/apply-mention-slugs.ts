export type MentionSlugItem = {
  name: string;
  slug: string;
};

/**
 * Replaces `@Name` mentions (as serialized by the prompt editor) with the
 * runtime slug in backticks, e.g. `@Get Weather` → `` `get_weather` `` or
 * `@Web Search (web_get_content)` → `` `web_search__web_get_content` ``.
 *
 * Mirrors the editor's matching rules: names are matched case-sensitively,
 * longest name first, immediately after an `@`, with no boundary check after
 * the name. Unknown `@…` text is left untouched.
 */
export function applyMentionSlugs(
  prompt: string,
  items: MentionSlugItem[],
): string {
  if (!prompt.includes("@") || items.length === 0) {
    return prompt;
  }

  const itemsByLongestName = items
    .filter((item) => item.name.length > 0)
    .sort((a, b) => b.name.length - a.name.length);

  let output = "";
  let cursor = 0;

  while (cursor < prompt.length) {
    const atIndex = prompt.indexOf("@", cursor);

    if (atIndex === -1) {
      output += prompt.slice(cursor);
      break;
    }

    const match = itemsByLongestName.find((item) =>
      prompt.startsWith(item.name, atIndex + 1),
    );

    if (!match) {
      output += prompt.slice(cursor, atIndex + 1);
      cursor = atIndex + 1;
      continue;
    }

    output += `${prompt.slice(cursor, atIndex)}\`${match.slug}\``;
    cursor = atIndex + 1 + match.name.length;
  }

  return output;
}
