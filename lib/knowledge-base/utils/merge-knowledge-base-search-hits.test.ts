import { describe, expect, it } from "vitest";

import type { KnowledgeBaseSearchHit } from "../types";
import { mergeKnowledgeBaseSearchHits } from "./merge-knowledge-base-search-hits";

function createHit(
  overrides: Partial<KnowledgeBaseSearchHit> & Pick<KnowledgeBaseSearchHit, "id" | "score">,
): KnowledgeBaseSearchHit {
  return {
    text: "Sample text",
    filename: "guide.md",
    sectionTitle: "Intro",
    headingPath: "Intro",
    documentId: "doc-1",
    knowledgeBaseId: "kb-1",
    ...overrides,
  };
}

describe("mergeKnowledgeBaseSearchHits", () => {
  it("dedupes by id and keeps the highest score", () => {
    const merged = mergeKnowledgeBaseSearchHits(
      [
        createHit({ id: "doc-1:0", score: 0.4 }),
        createHit({ id: "doc-1:0", score: 0.9, text: "Better excerpt" }),
        createHit({ id: "doc-1:1", score: 0.7 }),
      ],
      8,
    );

    expect(merged).toHaveLength(2);
    expect(merged[0]?.id).toBe("doc-1:0");
    expect(merged[0]?.score).toBe(0.9);
    expect(merged[0]?.text).toBe("Better excerpt");
    expect(merged[1]?.id).toBe("doc-1:1");
  });

  it("sorts by score descending and applies the limit", () => {
    const merged = mergeKnowledgeBaseSearchHits(
      [
        createHit({ id: "a", score: 0.2 }),
        createHit({ id: "b", score: 0.8 }),
        createHit({ id: "c", score: 0.5 }),
      ],
      2,
    );

    expect(merged.map((hit) => hit.id)).toEqual(["b", "c"]);
  });
});
