import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { knowledgeBaseDocuments, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { upsertJobStatusTracking } from "@/lib/notification/services/upsert-job-status-tracking";

import type {
  CreateKnowledgeBaseDocumentParams,
  CreateKnowledgeBaseDocumentResult,
} from "../types";
import { buildKnowledgeBaseDocumentJobKey } from "../utils/build-knowledge-base-r2-key";
import { enqueueKnowledgeBaseDocumentProcessJob } from "./enqueue-knowledge-base-document-process-job";

export async function createKnowledgeBaseDocument(
  params: CreateKnowledgeBaseDocumentParams,
): Promise<CreateKnowledgeBaseDocumentResult> {
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

  const expectedPrefix = `kb/${params.workspaceId}/${params.knowledgeBaseId}/uploads/`;
  const normalizedKey = params.key.trim().replace(/^\//, "");
  if (!normalizedKey.startsWith(expectedPrefix) || normalizedKey.includes("..")) {
    throw new APIError(
      "ERR_INVALID_UPLOAD_KEY",
      "Upload key is not valid for this knowledge base.",
      400,
    );
  }

  const [document] = await db
    .insert(knowledgeBaseDocuments)
    .values({
      knowledgeBaseId: params.knowledgeBaseId,
      workspaceId: params.workspaceId,
      filename: params.filename.trim(),
      contentType: params.contentType.trim(),
      sizeBytes: String(params.contentLength),
      sourceR2Key: normalizedKey,
      status: "uploaded",
    })
    .returning({ id: knowledgeBaseDocuments.id });

  if (!document) {
    throw new Error("Failed to create knowledge base document.");
  }

  const jobKey = buildKnowledgeBaseDocumentJobKey(document.id);

  await upsertJobStatusTracking({
    jobKey,
    status: "pending",
    payload: {
      documentId: document.id,
      knowledgeBaseId: params.knowledgeBaseId,
      stage: "queued",
    },
  });

  await enqueueKnowledgeBaseDocumentProcessJob({
    userId: params.userId,
    payload: {
      documentId: document.id,
      workspaceId: params.workspaceId,
      knowledgeBaseId: params.knowledgeBaseId,
    },
  });

  return {
    id: document.id,
    jobKey,
    message: "Document uploaded. Processing started.",
  };
}
