import "server-only";

import { and, eq } from "drizzle-orm";

import { knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { getUploadSignedUrl } from "@/lib/r2/services/get-upload-signed-url";

import { KNOWLEDGE_BASE_UPLOAD_RULES } from "../constants";
import type { GetKnowledgeBaseDocumentUploadUrlParams } from "../types";
import { buildKnowledgeBaseUploadPrefix } from "../utils/build-knowledge-base-r2-key";

export async function getKnowledgeBaseDocumentUploadUrl(
  params: GetKnowledgeBaseDocumentUploadUrlParams,
) {
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

  return getUploadSignedUrl({
    contentType: params.contentType,
    contentLength: params.contentLength,
    maxBytes: KNOWLEDGE_BASE_UPLOAD_RULES.maxBytes,
    allowedMimes: KNOWLEDGE_BASE_UPLOAD_RULES.allowedMimes,
    mimeError: KNOWLEDGE_BASE_UPLOAD_RULES.mimeError,
    sizeError: KNOWLEDGE_BASE_UPLOAD_RULES.sizeError,
    prefix: buildKnowledgeBaseUploadPrefix({
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.knowledgeBaseId,
    }),
  });
}
