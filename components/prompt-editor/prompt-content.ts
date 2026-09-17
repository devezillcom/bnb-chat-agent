import type { Editor, JSONContent } from "@tiptap/core";

import { applyMentionsToDoc } from "./apply-mentions-to-doc";
import type { MentionItem } from "./types";

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function parsePromptMarkdown(
  editor: Editor,
  markdown: string,
  items: MentionItem[],
): JSONContent {
  if (!markdown) return EMPTY_DOC;

  const parsed = editor.markdown?.parse(markdown) ?? EMPTY_DOC;
  if (!parsed.content?.length) return EMPTY_DOC;

  return applyMentionsToDoc(parsed, items);
}

export function setPromptContent(
  editor: Editor,
  markdown: string,
  items: MentionItem[],
) {
  editor.commands.setContent(parsePromptMarkdown(editor, markdown, items), {
    emitUpdate: false,
  });
}

export function getPromptMarkdown(editor: Editor): string {
  return editor.getMarkdown().replaceAll("\u00a0", " ").trimEnd();
}
