import Mention from "@tiptap/extension-mention";
import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { applyMentionsToDoc } from "./apply-mentions-to-doc";
import type { MentionItem } from "./types";

const items: MentionItem[] = [
  { id: "tool-1", type: "tool", name: "Search", slug: "search" },
];

const mention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mentionType: { default: "tool" },
    };
  },
  renderMarkdown: (node) => `@${node.attrs?.label ?? node.attrs?.id ?? ""}`,
});

const markdownManager = new MarkdownManager({
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    mention,
  ],
});

describe("prompt markdown round-trip", () => {
  it("keeps headings, emphasis, and @Name mentions", () => {
    const parsed = markdownManager.parse(
      "## Role\n\nUse **@Search** to find stays.",
    );
    const withMentions = applyMentionsToDoc(parsed, items);
    const markdown = markdownManager.serialize(withMentions);

    expect(markdown).toContain("## Role");
    expect(markdown).toMatch(/\*\*@Search\*\*|@Search/);
    expect(markdown).not.toContain("[@");
    expect(
      JSON.stringify(withMentions).includes('"type":"mention"'),
    ).toBe(true);
  });
});
