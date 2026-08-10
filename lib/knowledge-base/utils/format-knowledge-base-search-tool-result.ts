import type {
  KnowledgeBaseSearchHit,
  SearchKnowledgeBaseToolResult,
} from "../types";

export function buildKnowledgeBaseSourceLabel(hit: KnowledgeBaseSearchHit): string {
  const section =
    hit.sectionTitle?.trim() ||
    hit.headingPath?.trim() ||
    "Document excerpt";

  return `${hit.filename} > ${section}`;
}

export function formatKnowledgeBaseSearchToolResult(params: {
  hits: KnowledgeBaseSearchHit[];
  queriesUsed: string[];
  strategiesUsed: SearchKnowledgeBaseToolResult["strategiesUsed"];
}): SearchKnowledgeBaseToolResult {
  return {
    results: params.hits.map((hit) => ({
      text: hit.text,
      source: buildKnowledgeBaseSourceLabel(hit),
      filename: hit.filename,
      sectionTitle: hit.sectionTitle,
      score: hit.score,
    })),
    queriesUsed: params.queriesUsed,
    strategiesUsed: params.strategiesUsed,
  };
}
