import { describe, expect, it } from "vitest";

import { applyMentionsToDoc } from "./apply-mentions-to-doc";
import type { MentionItem } from "./types";

const items: MentionItem[] = [
  { id: "tool-1", type: "tool", name: "Search", slug: "search" },
  { id: "skill-1", type: "skill", name: "Search Rooms", slug: "search_rooms" },
];

describe("applyMentionsToDoc", () => {
  it("turns matching @Name text into mention nodes", () => {
    const doc = applyMentionsToDoc(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Use @Search to look up stays." }],
          },
        ],
      },
      items,
    );

    expect(doc.content?.[0]?.content).toEqual([
      { type: "text", text: "Use " },
      {
        type: "mention",
        attrs: { id: "tool-1", label: "Search", mentionType: "tool" },
      },
      { type: "text", text: " to look up stays." },
    ]);
  });

  it("prefers the longest matching name", () => {
    const doc = applyMentionsToDoc(
      {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Call @Search Rooms first" }],
          },
        ],
      },
      items,
    );

    expect(doc.content?.[0]?.content).toEqual([
      { type: "text", text: "Call " },
      {
        type: "mention",
        attrs: {
          id: "skill-1",
          label: "Search Rooms",
          mentionType: "skill",
        },
      },
      { type: "text", text: " first" },
    ]);
  });

  it("preserves marks on surrounding text", () => {
    const bold = [{ type: "bold" }];
    const doc = applyMentionsToDoc(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Try @Search now", marks: bold },
            ],
          },
        ],
      },
      items,
    );

    expect(doc.content?.[0]?.content).toEqual([
      { type: "text", text: "Try ", marks: bold },
      {
        type: "mention",
        attrs: { id: "tool-1", label: "Search", mentionType: "tool" },
      },
      { type: "text", text: " now", marks: bold },
    ]);
  });

  it("does not rewrite mentions inside code blocks", () => {
    const codeBlock = {
      type: "codeBlock",
      content: [{ type: "text", text: "Use @Search in code" }],
    };
    const doc = applyMentionsToDoc(
      { type: "doc", content: [codeBlock] },
      items,
    );

    expect(doc.content?.[0]).toEqual(codeBlock);
  });

  it("does not rewrite mentions inside inline code", () => {
    const inlineCode = {
      type: "text",
      text: "@Search",
      marks: [{ type: "code" }],
    };
    const doc = applyMentionsToDoc(
      {
        type: "doc",
        content: [{ type: "paragraph", content: [inlineCode] }],
      },
      items,
    );

    expect(doc.content?.[0]?.content).toEqual([inlineCode]);
  });

  it("hydrates mentionType on existing mention nodes", () => {
    const doc = applyMentionsToDoc(
      {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "mention", attrs: { id: "skill-1", label: "Search Rooms" } },
            ],
          },
        ],
      },
      items,
    );

    expect(doc.content?.[0]?.content).toEqual([
      {
        type: "mention",
        attrs: {
          id: "skill-1",
          label: "Search Rooms",
          mentionType: "skill",
        },
      },
    ]);
  });
});
