import type { KnowledgeBaseSearchHit } from "../types";

export function mergeKnowledgeBaseSearchHits(
  hits: KnowledgeBaseSearchHit[],
  limit: number,
): KnowledgeBaseSearchHit[] {
  const byId = new Map<string, KnowledgeBaseSearchHit>();

  for (const hit of hits) {
    const existing = byId.get(hit.id);
    if (!existing || hit.score > existing.score) {
      byId.set(hit.id, hit);
    }
  }

  return [...byId.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
