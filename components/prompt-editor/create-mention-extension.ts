import type { JSONContent } from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";

import { MentionList, type MentionListRef } from "./mention-list";
import type { MentionItem } from "./types";

const MAX_SUGGESTIONS = 20;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      /**
       * Updates the live tools/skills list the "@" suggestion popup
       * searches through, without touching the document or history.
       */
      setMentionItems: (items: MentionItem[]) => ReturnType;
      /** Inserts a mention node at the current selection. */
      insertMention: (item: MentionItem) => ReturnType;
    };
  }

  interface Storage {
    mention: { items: MentionItem[] };
  }
}

// Adds a "mentionType" attribute (tool | skill) on top of Mention's default
// id/label attrs so the rendered chip and dropdown icon can tell them apart.
// Also keeps the live tools/skills list in the editor's own `storage` (kept
// in sync via the `setMentionItems` command from a `useEffect` in
// PromptEditor) so the "@" suggestion callback below can always read fresh
// data without the extension - or the editor itself - ever needing to be
// recreated when the list changes.
//
// Mentions serialize to LLM-readable "@Name" markdown (not TipTap's default
// `[@ id="..."]` shortcode) so the stored system prompt stays usable as-is.
const AgentMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mentionType: {
        default: "tool",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-mention-type") ?? "tool",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-mention-type": attributes.mentionType,
        }),
      },
    };
  },
  addStorage() {
    return { items: [] as MentionItem[] };
  },
  addCommands() {
    return {
      setMentionItems:
        (items: MentionItem[]) =>
        ({ editor }) => {
          editor.storage.mention.items = items;
          return true;
        },
      insertMention:
        (item: MentionItem) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent([
              {
                type: "mention",
                attrs: {
                  id: item.id,
                  label: item.name,
                  mentionType: item.type,
                },
              },
              { type: "text", text: " " },
            ])
            .run(),
    };
  },
  renderMarkdown: (node: JSONContent) =>
    `@${node.attrs?.label ?? node.attrs?.id ?? ""}`,
});

export function createMentionExtension() {
  return AgentMention.configure({
    HTMLAttributes: { class: "mention" },
    deleteTriggerWithBackspace: true,
    renderText({ node }) {
      return `@${node.attrs.label ?? node.attrs.id}`;
    },
    suggestion: {
      char: "@",
      allowSpaces: false,
      items: ({ editor, query }) => {
        const normalizedQuery = query.trim().toLowerCase();
        const items = (editor.storage.mention?.items ?? []) as MentionItem[];

        if (!normalizedQuery) return items.slice(0, MAX_SUGGESTIONS);

        return items
          .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
          .slice(0, MAX_SUGGESTIONS);
      },
      render: () => {
        let component: ReactRenderer<MentionListRef> | null = null;
        let unmount: (() => void) | null = null;

        return {
          onStart(props) {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) return;
            unmount = props.mount(component.element);
          },
          onUpdate(props) {
            component?.updateProps(props);
          },
          onKeyDown(props) {
            if (props.event.key === "Escape") {
              unmount?.();
              component?.destroy();
              return true;
            }

            return component?.ref?.onKeyDown(props) ?? false;
          },
          onExit() {
            unmount?.();
            component?.destroy();
          },
        };
      },
    } satisfies Partial<SuggestionOptions<MentionItem>>,
  });
}
