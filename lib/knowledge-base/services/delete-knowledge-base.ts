import "server-only";

import { and, eq } from "drizzle-orm";

import { knowledgeBaseDocuments, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { DeleteKnowledgeBaseParams, DeleteKnowledgeBaseResult } from "../types";
import { deleteKnowledgeBaseDocument } from "./delete-knowledge-base-document";

export async function deleteKnowledgeBase(
  params: DeleteKnowledgeBaseParams,
): Promise<DeleteKnowledgeBaseResult> {
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

  const documents = await db
    .select({ id: knowledgeBaseDocuments.id })
    .from(knowledgeBaseDocuments)
    .where(
      and(
        eq(knowledgeBaseDocuments.knowledgeBaseId, params.knowledgeBaseId),
        eq(knowledgeBaseDocuments.workspaceId, params.workspaceId),
      ),
    );

  for (const document of documents) {
    await deleteKnowledgeBaseDocument({
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.knowledgeBaseId,
      documentId: document.id,
    });
  }

  await db
    .delete(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.id, params.knowledgeBaseId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    );

  return {
    message: "Knowledge base deleted.",
  };
}
