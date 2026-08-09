import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { knowledgeBaseDocuments, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  KnowledgeBaseChunkStrategy,
  KnowledgeBaseDetectedLanguage,
  KnowledgeBaseDocumentStatus,
} from "../constants";
import type {
  ListKnowledgeBaseDocumentsParams,
  ListKnowledgeBaseDocumentsResult,
} from "../types";
import { buildKnowledgeBaseDocumentJobKey } from "../utils/build-knowledge-base-r2-key";

export async function listKnowledgeBaseDocuments(
  params: ListKnowledgeBaseDocumentsParams,
): Promise<ListKnowledgeBaseDocumentsResult> {
  const [knowledgeBase] = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.id, params.knowledgeBaseId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!knowledgeBase) {
    throw new APIError(
      "ERR_KB_NOT_FOUND",
      "Knowledge base not found.",
      404,
    );
  }

  const whereClause = and(
    eq(knowledgeBaseDocuments.knowledgeBaseId, params.knowledgeBaseId),
    eq(knowledgeBaseDocuments.workspaceId, params.workspaceId),
  );

  const [{ total }] = await db
    .select({ total: count() })
    .from(knowledgeBaseDocuments)
    .where(whereClause);

  const rows = await db
    .select()
    .from(knowledgeBaseDocuments)
    .where(whereClause)
    .orderBy(desc(knowledgeBaseDocuments.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  const nextOffset =
    params.offset + rows.length < total ? params.offset + rows.length : null;

  return {
    items: rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      contentType: row.contentType,
      sizeBytes: Number(row.sizeBytes),
      status: row.status as KnowledgeBaseDocumentStatus,
      detectedLanguage: (row.detectedLanguage as KnowledgeBaseDetectedLanguage | null) ?? null,
      chunkStrategy: (row.chunkStrategy as KnowledgeBaseChunkStrategy | null) ?? null,
      chunkCount: row.chunkCount ? Number(row.chunkCount) : null,
      errorMessage: row.errorMessage,
      processedAt: row.processedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      jobKey: buildKnowledgeBaseDocumentJobKey(row.id),
    })),
    total,
    nextOffset,
  };
}
