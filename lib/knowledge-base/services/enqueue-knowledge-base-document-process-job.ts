import "server-only";

import { addJob } from "@/lib/qstash/services/add-job-service";

import { KNOWLEDGE_BASE_DOCUMENT_PROCESS_QSTASH_JOB_NAME } from "../constants";
import type { KnowledgeBaseDocumentProcessQstashPayload } from "../schema";

export async function enqueueKnowledgeBaseDocumentProcessJob(params: {
  userId: string;
  payload: KnowledgeBaseDocumentProcessQstashPayload;
}): Promise<void> {
  await addJob({
    userId: params.userId,
    jobName: KNOWLEDGE_BASE_DOCUMENT_PROCESS_QSTASH_JOB_NAME,
    payload: params.payload,
    flowControl: {
      key: `kb-doc-${params.payload.documentId}`,
      parallelism: 1,
    },
  });
}
