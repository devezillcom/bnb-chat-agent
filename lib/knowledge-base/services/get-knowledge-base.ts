import "server-only";

import { and, count, eq } from "drizzle-orm";

import { knowledgeBaseDocuments, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { GetKnowledgeBaseParams, GetKnowledgeBaseResult } from "../types";

export async function getKnowledgeBase(
  params: GetKnowledgeBaseParams,
): Promise<GetKnowledgeBaseResult> {
  const [row] = await db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      slug: knowledgeBases.slug,
      description: knowledgeBases.description,
      createdAt: knowledgeBases.createdAt,
      updatedAt: knowledgeBases.updatedAt,
      documentCount: count(knowledgeBaseDocuments.id),
    })
    .from(knowledgeBases)
    .leftJoin(
      knowledgeBaseDocuments,
      eq(knowledgeBaseDocuments.knowledgeBaseId, knowledgeBases.id),
    )
    .where(
      and(
        eq(knowledgeBases.id, params.knowledgeBaseId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    )
    .groupBy(knowledgeBases.id)
    .limit(1);

  if (!row) {
    throw new APIError(
      "ERR_KB_NOT_FOUND",
      "Knowledge base not found.",
      404,
    );
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    documentCount: Number(row.documentCount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
