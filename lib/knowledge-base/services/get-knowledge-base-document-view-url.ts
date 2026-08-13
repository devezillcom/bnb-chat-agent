import "server-only";

import { and, eq } from "drizzle-orm";

import { knowledgeBaseDocuments } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { getDownloadSignedUrl } from "@/lib/r2/services/get-download-signed-url";

import type {
  GetKnowledgeBaseDocumentViewUrlParams,
  GetKnowledgeBaseDocumentViewUrlResult,
} from "../types";

export async function getKnowledgeBaseDocumentViewUrl(
  params: GetKnowledgeBaseDocumentViewUrlParams,
): Promise<GetKnowledgeBaseDocumentViewUrlResult> {
  const [document] = await db
    .select({
      sourceR2Key: knowledgeBaseDocuments.sourceR2Key,
      filename: knowledgeBaseDocuments.filename,
      contentType: knowledgeBaseDocuments.contentType,
    })
    .from(knowledgeBaseDocuments)
    .where(
      and(
        eq(knowledgeBaseDocuments.id, params.documentId),
        eq(knowledgeBaseDocuments.knowledgeBaseId, params.knowledgeBaseId),
        eq(knowledgeBaseDocuments.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!document) {
    throw new APIError(
      "ERR_KB_DOCUMENT_NOT_FOUND",
      "Document not found.",
      404,
    );
  }

  const { downloadUrl, expiresAt } = await getDownloadSignedUrl({
    key: document.sourceR2Key,
    contentType: document.contentType,
    filename: document.filename,
  });

  return {
    viewUrl: downloadUrl,
    expiresAt,
  };
}
