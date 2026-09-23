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

export function getSelectionMarkdown(editor: Editor): string | null {
  const { from, to, empty } = editor.state.selection;
  if (empty || from === to) return null;

  const slice = editor.state.doc.slice(from, to);
  if (!slice.content.size) return null;

  const markdown = editor.markdown?.serialize({
    type: "doc",
    content: slice.content.toJSON(),
  });
  const normalized = markdown?.replaceAll("\u00a0", " ").trim();
  return normalized || null;
}

export function replaceSelectionWithMarkdown(
  editor: Editor,
  range: { from: number; to: number },
  markdown: string,
  items: MentionItem[],
) {
  const parsed = parsePromptMarkdown(editor, markdown, items);
  editor.chain().focus().insertContentAt(range, parsed).run();
}
