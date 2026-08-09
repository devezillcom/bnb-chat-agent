import "server-only";

import { and, eq } from "drizzle-orm";

import { knowledgeBaseDocuments } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { deleteObjectsFromR2 } from "@/lib/r2/services/delete-objects-from-r2";
import { getObjectFromR2 } from "@/lib/r2/services/get-object-from-r2";

import type {
  DeleteKnowledgeBaseDocumentParams,
  DeleteKnowledgeBaseDocumentResult,
} from "../types";
import type { KnowledgeBaseIndexResult } from "../types";
import { collectKnowledgeBaseDocumentR2Keys } from "../utils/collect-knowledge-base-document-r2-keys";
import { deleteKnowledgeBaseChunkRecords } from "./index-knowledge-base-chunks";

export async function deleteKnowledgeBaseDocument(
  params: DeleteKnowledgeBaseDocumentParams,
): Promise<DeleteKnowledgeBaseDocumentResult> {
  const [document] = await db
    .select()
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

  if (document.indexResultR2Key) {
    try {
      const indexObject = await getObjectFromR2({
        key: document.indexResultR2Key,
      });
      const indexResult = JSON.parse(
        indexObject.body.toString("utf8"),
      ) as KnowledgeBaseIndexResult;

      if (document.pineconeNamespace && indexResult.recordIds?.length) {
        await deleteKnowledgeBaseChunkRecords({
          namespace: document.pineconeNamespace,
          recordIds: indexResult.recordIds,
        });
      }
    } catch (error) {
      console.error("[delete-knowledge-base-document] Pinecone cleanup failed", {
        documentId: document.id,
        error,
      });
    }
  }

  const r2Keys = collectKnowledgeBaseDocumentR2Keys(document);

  try {
    await deleteObjectsFromR2({ keys: r2Keys });
  } catch (error) {
    console.error("[delete-knowledge-base-document] R2 cleanup failed", {
      documentId: document.id,
      keys: r2Keys,
      error,
    });
    throw new APIError(
      "ERR_R2_DELETE_FAILED",
      "Could not delete document files from storage.",
      500,
    );
  }

  await db
    .delete(knowledgeBaseDocuments)
    .where(eq(knowledgeBaseDocuments.id, document.id));

  return {
    message: "Document deleted.",
  };
}
