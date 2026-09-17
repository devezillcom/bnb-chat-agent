import type { JSONContent } from "@tiptap/core";

import type { MentionItem } from "./types";

const CODE_NODE_TYPES = new Set(["codeBlock", "code"]);

/**
 * Walks a Tiptap JSON document and turns "@Name" text that matches a known
 * mention item into atomic mention nodes. Skips fenced/inline code so example
 * snippets stay literal.
 */
export function applyMentionsToDoc(
  doc: JSONContent,
  items: MentionItem[],
): JSONContent {
  if (items.length === 0) return doc;

  const itemsByLongestName = [...items].sort(
    (a, b) => b.name.length - a.name.length,
  );

  return walkNode(doc, items, itemsByLongestName, false);
}

function walkNode(
  node: JSONContent,
  items: MentionItem[],
  itemsByLongestName: MentionItem[],
  inCode: boolean,
): JSONContent {
  if (node.type === "mention") {
    return hydrateMention(node, items);
  }

  if (!node.content || node.content.length === 0) return node;

  const nextInCode = inCode || CODE_NODE_TYPES.has(node.type ?? "");
  const content: JSONContent[] = [];

  for (const child of node.content) {
    if (
      !nextInCode &&
      child.type === "text" &&
      typeof child.text === "string" &&
      !hasCodeMark(child)
    ) {
      content.push(...splitTextWithMentions(child, itemsByLongestName));
      continue;
    }

    content.push(walkNode(child, items, itemsByLongestName, nextInCode));
  }

  return { ...node, content };
}

function hydrateMention(node: JSONContent, items: MentionItem[]): JSONContent {
  const id = typeof node.attrs?.id === "string" ? node.attrs.id : "";
  const label = typeof node.attrs?.label === "string" ? node.attrs.label : "";
  const item =
    items.find((candidate) => candidate.id === id) ??
    items.find((candidate) => candidate.name === label);

  if (!item) return node;

  return {
    type: "mention",
    attrs: { id: item.id, label: item.name, mentionType: item.type },
  };
}

function hasCodeMark(node: JSONContent): boolean {
  return node.marks?.some((mark) => mark.type === "code") ?? false;
}

function splitTextWithMentions(
  node: JSONContent,
  itemsByLongestName: MentionItem[],
): JSONContent[] {
  const text = node.text ?? "";
  const marks = node.marks;

  if (itemsByLongestName.length === 0 || !text.includes("@")) {
    return [node];
  }

  const nodes: JSONContent[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const atIndex = text.indexOf("@", cursor);

    if (atIndex === -1) {
      nodes.push(textNode(text.slice(cursor), marks));
      break;
    }

    const match = itemsByLongestName.find((item) =>
      text.startsWith(item.name, atIndex + 1),
    );

    if (!match) {
      nodes.push(textNode(text.slice(cursor, atIndex + 1), marks));
      cursor = atIndex + 1;
      continue;
    }

    if (atIndex > cursor) {
      nodes.push(textNode(text.slice(cursor, atIndex), marks));
    }

    nodes.push({
      type: "mention",
      attrs: { id: match.id, label: match.name, mentionType: match.type },
    });
    cursor = atIndex + 1 + match.name.length;
  }

  return nodes.length > 0 ? nodes : [node];
}

function textNode(
  text: string,
  marks: JSONContent["marks"],
): JSONContent {
  if (marks && marks.length > 0) {
    return { type: "text", text, marks };
  }

  return { type: "text", text };
}
