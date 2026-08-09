export const KNOWLEDGE_BASE_DOCUMENT_PROCESS_QSTASH_JOB_NAME =
  "knowledge-base-document-process";

export const KNOWLEDGE_BASE_DOCUMENT_JOB_KEY_PREFIX = "kb-doc";

export const KNOWLEDGE_BASE_R2_PREFIX = "kb";

export const KNOWLEDGE_BASE_DOCUMENT_STATUSES = [
  "pending_upload",
  "uploaded",
  "converting",
  "classifying",
  "chunking",
  "indexing",
  "ready",
  "failed",
] as const;

export type KnowledgeBaseDocumentStatus =
  (typeof KNOWLEDGE_BASE_DOCUMENT_STATUSES)[number];

export const KNOWLEDGE_BASE_CHUNK_STRATEGIES = [
  "chunk_markdown_by_heading",
  "chunk_contract_by_article",
  "chunk_tabular_data",
  "chunk_slide_by_slide",
  "chunk_qa_pairs",
  "chunk_recursive_by_token",
] as const;

export type KnowledgeBaseChunkStrategy =
  (typeof KNOWLEDGE_BASE_CHUNK_STRATEGIES)[number];

export const KNOWLEDGE_BASE_DETECTED_LANGUAGES = [
  "vi",
  "en",
  "mixed",
  "unknown",
] as const;

export type KnowledgeBaseDetectedLanguage =
  (typeof KNOWLEDGE_BASE_DETECTED_LANGUAGES)[number];

export const KNOWLEDGE_BASE_UPLOAD_RULES = {
  maxBytes: 50 * 1024 * 1024,
  allowedMimes: new Set([
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/csv",
    "application/rtf",
    "text/rtf",
    "application/epub+zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
  ]),
  mimeError: "Unsupported document type.",
  sizeError: "Document must be 50 MB or smaller.",
} as const;

export const KNOWLEDGE_BASE_PINECONE_BATCH_SIZE = 96;

export const KNOWLEDGE_BASE_CLASSIFIER_MODEL =
  process.env.KNOWLEDGE_BASE_CLASSIFIER_MODEL?.trim() || "claude-haiku-4-5";

export const KNOWLEDGE_BASE_HEURISTIC_CLASSIFY_THRESHOLD = 0.72;
