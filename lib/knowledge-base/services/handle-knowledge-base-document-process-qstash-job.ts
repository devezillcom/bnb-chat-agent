import type { QstashJobHandlerContext } from "@/lib/qstash/job-config";

import { knowledgeBaseDocumentProcessQstashPayloadSchema } from "../schema";
import { processKnowledgeBaseDocument } from "./process-knowledge-base-document";

export async function handleKnowledgeBaseDocumentProcessQstashJob(
  payload: unknown,
  _context: QstashJobHandlerContext,
): Promise<void> {
  const parsed = knowledgeBaseDocumentProcessQstashPayloadSchema.parse(payload);

  try {
    await processKnowledgeBaseDocument(parsed);
  } catch (error) {
    console.error("[knowledge-base-document-process] QStash job failed", {
      documentId: parsed.documentId,
      knowledgeBaseId: parsed.knowledgeBaseId,
      error,
    });
    throw error;
  }
}
