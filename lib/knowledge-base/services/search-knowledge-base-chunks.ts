import "server-only";

import {
  KNOWLEDGE_BASE_SEARCH_RERANK_MODEL,
  KNOWLEDGE_BASE_SEARCH_RERANK_TOP_N,
  KNOWLEDGE_BASE_SEARCH_TOP_K,
} from "@/lib/knowledge-base/constants";
import {
  PINECONE_KB_EMBED_FIELD,
} from "@/lib/pinecone/constants";
import {
  getPineconeIntegratedIndex,
  isPineconeConfigured,
} from "@/lib/pinecone/utils/get-pinecone-client";

import { generateKnowledgeBaseSearchQueries } from "./generate-knowledge-base-search-queries";
import { rewriteKnowledgeBaseSearchQuery } from "./rewrite-knowledge-base-search-query";
import type {
  KnowledgeBaseSearchHit,
  SearchKnowledgeBaseChunksParams,
  SearchKnowledgeBaseChunksResult,
} from "../types";
import { mergeKnowledgeBaseSearchHits } from "../utils/merge-knowledge-base-search-hits";

type PineconeSearchRecordHit = {
  _id?: string;
  id?: string;
  _score?: number;
  score?: number;
  fields?: Record<string, unknown>;
};

function readStringField(
  fields: Record<string, unknown> | undefined,
  key: string,
): string {
  const value = fields?.[key];
  return typeof value === "string" ? value : "";
}

function readNullableStringField(
  fields: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = fields?.[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePineconeHit(hit: PineconeSearchRecordHit): KnowledgeBaseSearchHit | null {
  const id = hit._id ?? hit.id;
  const score = hit._score ?? hit.score;
  const fields = hit.fields;

  if (!id || typeof score !== "number") {
    return null;
  }

  const text = readStringField(fields, PINECONE_KB_EMBED_FIELD);
  if (!text) {
    return null;
  }

  const filename = readStringField(fields, "filename") || "Unknown document";
  const documentId = readStringField(fields, "documentId");
  const knowledgeBaseId = readStringField(fields, "knowledgeBaseId");

  if (!documentId || !knowledgeBaseId) {
    return null;
  }

  return {
    id,
    score,
    text,
    filename,
    sectionTitle: readNullableStringField(fields, "sectionTitle"),
    headingPath: readNullableStringField(fields, "headingPath"),
    documentId,
    knowledgeBaseId,
  };
}

async function searchPineconeOnce(params: {
  workspaceId: string;
  knowledgeBaseIds: string[];
  query: string;
}): Promise<KnowledgeBaseSearchHit[]> {
  const index = await getPineconeIntegratedIndex(params.workspaceId);
  const response = await index.searchRecords({
    query: {
      topK: KNOWLEDGE_BASE_SEARCH_TOP_K,
      inputs: { text: params.query },
      filter: {
        knowledgeBaseId: { $in: params.knowledgeBaseIds },
      },
    },
    rerank: {
      model: KNOWLEDGE_BASE_SEARCH_RERANK_MODEL,
      topN: KNOWLEDGE_BASE_SEARCH_RERANK_TOP_N,
      rankFields: [PINECONE_KB_EMBED_FIELD],
    },
    fields: [
      PINECONE_KB_EMBED_FIELD,
      "filename",
      "sectionTitle",
      "headingPath",
      "documentId",
      "knowledgeBaseId",
    ],
  });

  const hits = (response.result?.hits ?? []) as PineconeSearchRecordHit[];

  return hits
    .map((hit) => normalizePineconeHit(hit))
    .filter((hit): hit is KnowledgeBaseSearchHit => hit !== null);
}

async function resolveSearchQueries(
  params: SearchKnowledgeBaseChunksParams,
): Promise<{ queries: string[]; rewriteQuery: boolean; multiQuery: boolean }> {
  const rewriteQuery = params.rewriteQuery === true;
  const multiQuery = params.multiQuery === true;
  let query = params.query.trim();

  if (rewriteQuery) {
    query = await rewriteKnowledgeBaseSearchQuery({ query });
  }

  if (multiQuery) {
    return {
      queries: await generateKnowledgeBaseSearchQueries({ query }),
      rewriteQuery,
      multiQuery,
    };
  }

  return {
    queries: [query],
    rewriteQuery,
    multiQuery,
  };
}

export async function searchKnowledgeBaseChunks(
  params: SearchKnowledgeBaseChunksParams,
): Promise<SearchKnowledgeBaseChunksResult> {
  if (params.knowledgeBaseIds.length === 0) {
    return {
      hits: [],
      queriesUsed: [],
      strategiesUsed: {
        rewriteQuery: params.rewriteQuery === true,
        multiQuery: params.multiQuery === true,
      },
    };
  }

  if (!isPineconeConfigured()) {
    throw new Error("Pinecone is not configured.");
  }

  const { queries, rewriteQuery, multiQuery } = await resolveSearchQueries(params);
  const hitGroups = await Promise.all(
    queries.map((query) =>
      searchPineconeOnce({
        workspaceId: params.workspaceId,
        knowledgeBaseIds: params.knowledgeBaseIds,
        query,
      }),
    ),
  );

  return {
    hits: mergeKnowledgeBaseSearchHits(
      hitGroups.flat(),
      KNOWLEDGE_BASE_SEARCH_RERANK_TOP_N,
    ),
    queriesUsed: queries,
    strategiesUsed: {
      rewriteQuery,
      multiQuery,
    },
  };
}
