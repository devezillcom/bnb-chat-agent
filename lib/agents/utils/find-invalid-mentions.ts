const MENTION_CONTEXT_LENGTH = 48;

/**
 * Returns a short snippet for every `@` that the editor would NOT turn into a
 * mention. Uses the editor's matching rule (exact, case-sensitive, longest
 * name first); `@` glued to a preceding letter/digit (emails) is ignored.
 */
export function findInvalidMentions(
  text: string,
  mentionNames: string[],
): string[] {
  const invalid: string[] = [];
  let cursor = text.indexOf("@");

  while (cursor !== -1) {
    const previous = cursor > 0 ? text[cursor - 1] : "";
    const isStandalone = !/[\p{L}\p{N}_.]/u.test(previous);
    const isValid = mentionNames.some((name) =>
      text.startsWith(name, cursor + 1),
    );

    if (isStandalone && !isValid) {
      const snippet = text
        .slice(cursor, cursor + MENTION_CONTEXT_LENGTH)
        .split("\n")[0]
        .trimEnd();
      if (snippet.length > 1) invalid.push(snippet);
    }

    cursor = text.indexOf("@", cursor + 1);
  }

  return [...new Set(invalid)];
}
