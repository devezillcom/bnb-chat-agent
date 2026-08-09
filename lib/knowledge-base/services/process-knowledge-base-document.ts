import "server-only";

import { and, eq } from "drizzle-orm";

import type { KnowledgeBaseDocumentPipelineLog } from "@/db/schema";
import { knowledgeBaseDocuments } from "@/db/schema";
import { db } from "@/lib/db";
import { updateJobStatusTracking } from "@/lib/notification/services/update-job-status-tracking";
import { getObjectFromR2 } from "@/lib/r2/services/get-object-from-r2";
import { putObjectToR2 } from "@/lib/r2/services/put-object-to-r2";

import type { KnowledgeBaseDocumentStatus } from "../constants";
import { convertDocumentToMarkdown } from "../providers/convert-document-to-markdown";
import type { KnowledgeBaseDocumentProcessQstashPayload } from "../schema";
import type { KnowledgeBaseChunk, KnowledgeBaseIndexResult } from "../types";
import { buildKnowledgeBaseArtifactKey } from "../utils/build-knowledge-base-r2-key";
import { buildKnowledgeBaseDocumentJobKey } from "../utils/build-knowledge-base-r2-key";
import { chunkDocument } from "../utils/chunk-document";
import { classifyChunkStrategy } from "../utils/classify-chunk-strategy";
import { detectDocumentLanguage } from "../utils/detect-document-language";
import {
  deleteKnowledgeBaseChunkRecords,
  indexKnowledgeBaseChunks,
} from "./index-knowledge-base-chunks";

type PipelineStageLogger = {
  log: KnowledgeBaseDocumentPipelineLog;
  start: (name: string, details?: Record<string, unknown>) => void;
  succeed: (name: string, details?: Record<string, unknown>) => void;
  fail: (name: string, error: unknown) => never;
};

function createPipelineLogger(): PipelineStageLogger {
  const log: KnowledgeBaseDocumentPipelineLog = { stages: [] };

  return {
    log,
    start(name, details) {
      log.stages.push({
        name,
        status: "started",
        startedAt: new Date().toISOString(),
        details,
      });
    },
    succeed(name, details) {
      const stage = [...log.stages].reverse().find((item) => item.name === name);
      if (stage) {
        stage.status = "succeeded";
        stage.finishedAt = new Date().toISOString();
        stage.details = { ...(stage.details ?? {}), ...(details ?? {}) };
      }
    },
    fail(name, error) {
      const stage = [...log.stages].reverse().find((item) => item.name === name);
      const message = error instanceof Error ? error.message : String(error);
      if (stage) {
        stage.status = "failed";
        stage.finishedAt = new Date().toISOString();
        stage.error = message;
      }
      throw error instanceof Error ? error : new Error(message);
    },
  };
}

async function updateDocumentRow(
  documentId: string,
  values: Partial<typeof knowledgeBaseDocuments.$inferInsert>,
) {
  await db
    .update(knowledgeBaseDocuments)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(knowledgeBaseDocuments.id, documentId));
}

async function updateDocumentStatus(params: {
  documentId: string;
  status: KnowledgeBaseDocumentStatus;
  jobKey: string;
  stage: string;
  error?: string | null;
  extra?: Record<string, unknown>;
}) {
  await updateDocumentRow(params.documentId, {
    status: params.status,
    errorMessage: params.error ?? null,
  });

  await updateJobStatusTracking(params.jobKey, {
    status:
      params.status === "ready"
        ? "succeeded"
        : params.status === "failed"
          ? "failed"
          : "running",
    error: params.error ?? null,
    payload: {
      documentId: params.documentId,
      stage: params.stage,
      status: params.status,
      ...(params.extra ?? {}),
    },
  });
}

async function saveArtifact(params: {
  workspaceId: string;
  knowledgeBaseId: string;
  documentId: string;
  filename: string;
  body: Buffer | string;
  contentType: string;
}) {
  const key = buildKnowledgeBaseArtifactKey({
    workspaceId: params.workspaceId,
    knowledgeBaseId: params.knowledgeBaseId,
    documentId: params.documentId,
    filename: params.filename,
  });

  const body =
    typeof params.body === "string" ? Buffer.from(params.body, "utf8") : params.body;

  await putObjectToR2({
    key,
    body,
    contentType: params.contentType,
  });

  return key;
}

export async function processKnowledgeBaseDocument(
  payload: KnowledgeBaseDocumentProcessQstashPayload,
): Promise<void> {
  const [document] = await db
    .select()
    .from(knowledgeBaseDocuments)
    .where(
      and(
        eq(knowledgeBaseDocuments.id, payload.documentId),
        eq(knowledgeBaseDocuments.workspaceId, payload.workspaceId),
        eq(knowledgeBaseDocuments.knowledgeBaseId, payload.knowledgeBaseId),
      ),
    )
    .limit(1);

  if (!document) {
    throw new Error(`Knowledge base document not found: ${payload.documentId}`);
  }

  const jobKey = buildKnowledgeBaseDocumentJobKey(document.id);
  const logger = createPipelineLogger();
  let indexResult: KnowledgeBaseIndexResult | null = null;
  let chunks: KnowledgeBaseChunk[] = [];

  try {
    await updateDocumentStatus({
      documentId: document.id,
      status: "converting",
      jobKey,
      stage: "converting",
    });

    logger.start("fetch_source", { key: document.sourceR2Key });
    const source = await getObjectFromR2({ key: document.sourceR2Key });
    logger.succeed("fetch_source", { bytes: source.body.length });

    logger.start("convert_markdown");
    const converted = await convertDocumentToMarkdown({
      filename: document.filename,
      contentType: document.contentType,
      bytes: source.body,
    });
    logger.succeed("convert_markdown", {
      providerId: converted.providerId,
      charCount: converted.markdown.length,
    });

    const markdownR2Key = await saveArtifact({
      workspaceId: payload.workspaceId,
      knowledgeBaseId: payload.knowledgeBaseId,
      documentId: document.id,
      filename: "markdown.md",
      body: converted.markdown,
      contentType: "text/markdown",
    });

    await updateDocumentStatus({
      documentId: document.id,
      status: "classifying",
      jobKey,
      stage: "classifying",
      extra: { markdownR2Key },
    });

    logger.start("detect_language");
    const detectedLanguage = detectDocumentLanguage(
      converted.markdown,
      document.filename,
    );
    logger.succeed("detect_language", { detectedLanguage });

    logger.start("classify_chunk_strategy");
    const classification = await classifyChunkStrategy({
      filename: document.filename,
      contentType: document.contentType,
      markdown: converted.markdown,
      detectedLanguage,
    });
    logger.succeed("classify_chunk_strategy", classification);

    await updateDocumentStatus({
      documentId: document.id,
      status: "chunking",
      jobKey,
      stage: "chunking",
      extra: {
        detectedLanguage,
        chunkStrategy: classification.strategy,
      },
    });

    logger.start("chunk_document");
    chunks = await chunkDocument({
      markdown: converted.markdown,
      strategy: classification.strategy,
    });
    logger.succeed("chunk_document", { chunkCount: chunks.length });

    const chunksR2Key = await saveArtifact({
      workspaceId: payload.workspaceId,
      knowledgeBaseId: payload.knowledgeBaseId,
      documentId: document.id,
      filename: "chunks.json",
      body: JSON.stringify(chunks, null, 2),
      contentType: "application/json",
    });

    await updateDocumentStatus({
      documentId: document.id,
      status: "indexing",
      jobKey,
      stage: "indexing",
      extra: { chunkCount: chunks.length },
    });

    logger.start("index_pinecone");
    indexResult = await indexKnowledgeBaseChunks({
      namespace: payload.workspaceId,
      workspaceId: payload.workspaceId,
      knowledgeBaseId: payload.knowledgeBaseId,
      documentId: document.id,
      filename: document.filename,
      detectedLanguage,
      chunkStrategy: classification.strategy,
      chunks,
    });
    logger.succeed("index_pinecone", indexResult);

    const indexResultR2Key = await saveArtifact({
      workspaceId: payload.workspaceId,
      knowledgeBaseId: payload.knowledgeBaseId,
      documentId: document.id,
      filename: "index-result.json",
      body: JSON.stringify(indexResult, null, 2),
      contentType: "application/json",
    });

    const pipelineLogR2Key = await saveArtifact({
      workspaceId: payload.workspaceId,
      knowledgeBaseId: payload.knowledgeBaseId,
      documentId: document.id,
      filename: "pipeline-log.json",
      body: JSON.stringify(logger.log, null, 2),
      contentType: "application/json",
    });

    await updateDocumentRow(document.id, {
      status: "ready",
      detectedLanguage,
      chunkStrategy: classification.strategy,
      classificationReason: classification.reason,
      markdownR2Key,
      chunksR2Key,
      indexResultR2Key,
      pipelineLogR2Key,
      chunkCount: String(chunks.length),
      pineconeNamespace: indexResult.namespace,
      pineconeRecordCount: String(indexResult.recordCount),
      errorMessage: null,
      processedAt: new Date(),
    });

    await updateJobStatusTracking(jobKey, {
      status: "succeeded",
      payload: {
        documentId: document.id,
        stage: "ready",
        status: "ready",
        chunkCount: chunks.length,
        pineconeRecordCount: indexResult.recordCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[knowledge-base-document-process] Failed", {
      documentId: document.id,
      knowledgeBaseId: payload.knowledgeBaseId,
      error,
    });

    try {
      const pipelineLogR2Key = await saveArtifact({
        workspaceId: payload.workspaceId,
        knowledgeBaseId: payload.knowledgeBaseId,
        documentId: document.id,
        filename: "pipeline-log.json",
        body: JSON.stringify(logger.log, null, 2),
        contentType: "application/json",
      });

      await updateDocumentRow(document.id, {
        status: "failed",
        errorMessage: message,
        pipelineLogR2Key,
      });
    } catch (persistError) {
      console.error("[knowledge-base-document-process] Failed to persist error", {
        documentId: document.id,
        persistError,
      });
    }

    await updateJobStatusTracking(jobKey, {
      status: "failed",
      error: message,
      payload: {
        documentId: document.id,
        stage: "failed",
        status: "failed",
      },
    });

    throw error;
  }
}
