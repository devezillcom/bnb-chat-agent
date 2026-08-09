import "server-only";

import {
  KNOWLEDGE_BASE_PINECONE_BATCH_SIZE,
} from "@/lib/knowledge-base/constants";
import type {
  KnowledgeBaseChunk,
  KnowledgeBaseIndexResult,
} from "@/lib/knowledge-base/types";
import {
  PINECONE_KB_EMBED_FIELD,
  PINECONE_KB_MAX_CHUNK_TEXT_BYTES,
} from "@/lib/pinecone/constants";
import { getPineconeIntegratedIndex } from "@/lib/pinecone/utils/get-pinecone-client";

import { expandChunksForPineconeLimits } from "../utils/expand-chunks-for-pinecone-limits";

export type IndexKnowledgeBaseChunksParams = {
  namespace: string;
  workspaceId: string;
  knowledgeBaseId: string;
  documentId: string;
  filename: string;
  detectedLanguage: string | null;
  chunkStrategy: string;
  chunks: KnowledgeBaseChunk[];
};

export async function indexKnowledgeBaseChunks(
  params: IndexKnowledgeBaseChunksParams,
): Promise<KnowledgeBaseIndexResult> {
  const index = await getPineconeIntegratedIndex(params.namespace);
  const pineconeChunks = await expandChunksForPineconeLimits(
    params.chunks,
    PINECONE_KB_MAX_CHUNK_TEXT_BYTES,
  );

  if (pineconeChunks.length > params.chunks.length) {
    console.warn("[index-knowledge-base-chunks] Split oversized chunks for Pinecone", {
      documentId: params.documentId,
      originalChunkCount: params.chunks.length,
      pineconeChunkCount: pineconeChunks.length,
      maxTextBytes: PINECONE_KB_MAX_CHUNK_TEXT_BYTES,
    });
  }

  const recordIds: string[] = [];
  let batches = 0;

  for (
    let offset = 0;
    offset < pineconeChunks.length;
    offset += KNOWLEDGE_BASE_PINECONE_BATCH_SIZE
  ) {
    const slice = pineconeChunks.slice(
      offset,
      offset + KNOWLEDGE_BASE_PINECONE_BATCH_SIZE,
    );

    const records = slice.map((chunk) => {
      const id = `${params.documentId}:${chunk.index}`;
      recordIds.push(id);

      return {
        id,
        [PINECONE_KB_EMBED_FIELD]: chunk.text,
        workspaceId: params.workspaceId,
        knowledgeBaseId: params.knowledgeBaseId,
        documentId: params.documentId,
        chunkIndex: chunk.index,
        filename: params.filename,
        chunkStrategy: params.chunkStrategy,
        detectedLanguage: params.detectedLanguage ?? "unknown",
        headingPath: chunk.metadata.headingPath?.join(" > ").slice(0, 512) ?? "",
        sectionTitle: (chunk.metadata.sectionTitle ?? "").slice(0, 512),
      };
    });

    await index.upsertRecords({ records });
    batches += 1;
  }

  return {
    namespace: params.namespace,
    recordIds,
    recordCount: recordIds.length,
    batches,
    indexedAt: new Date().toISOString(),
  };
}

export async function deleteKnowledgeBaseChunkRecords(params: {
  namespace: string;
  recordIds: string[];
}): Promise<void> {
  if (params.recordIds.length === 0) {
    return;
  }

  const index = await getPineconeIntegratedIndex(params.namespace);

  for (
    let offset = 0;
    offset < params.recordIds.length;
    offset += KNOWLEDGE_BASE_PINECONE_BATCH_SIZE
  ) {
    const ids = params.recordIds.slice(
      offset,
      offset + KNOWLEDGE_BASE_PINECONE_BATCH_SIZE,
    );
    await index.deleteMany({ ids });
  }
}
