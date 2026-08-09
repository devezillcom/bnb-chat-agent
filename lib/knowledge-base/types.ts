import type { z } from "zod";

import type {
  KnowledgeBaseDetectedLanguage,
  KnowledgeBaseChunkStrategy,
  KnowledgeBaseDocumentStatus,
} from "./constants";
import type { knowledgeBaseFormSchema } from "./schema";

export type KnowledgeBaseFormBody = z.infer<typeof knowledgeBaseFormSchema>;

export type KnowledgeBaseListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentKnowledgeBaseItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  documentCount: number;
};

export type ListAgentKnowledgeBasesParams = {
  workspaceId: string;
  agentId: string;
};

export type ListAgentKnowledgeBasesResult = AgentKnowledgeBaseItem[];

export type AssignAgentKnowledgeBaseParams = {
  workspaceId: string;
  agentId: string;
  knowledgeBaseId: string;
};

export type AssignAgentKnowledgeBaseResult = {
  message: string;
};

export type KnowledgeBaseDocumentListItem = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  status: KnowledgeBaseDocumentStatus;
  detectedLanguage: KnowledgeBaseDetectedLanguage | null;
  chunkStrategy: KnowledgeBaseChunkStrategy | null;
  chunkCount: number | null;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  jobKey: string;
};

export type KnowledgeBaseChunk = {
  index: number;
  text: string;
  metadata: {
    headingPath?: string[];
    sectionTitle?: string;
    sourceChunkIndex?: number;
    partIndex?: number;
    partCount?: number;
    strategy: KnowledgeBaseChunkStrategy;
  };
};

export type KnowledgeBaseIndexResult = {
  namespace: string;
  recordIds: string[];
  recordCount: number;
  batches: number;
  indexedAt: string;
};

export type CreateKnowledgeBaseParams = KnowledgeBaseFormBody & {
  workspaceId: string;
};

export type CreateKnowledgeBaseResult = {
  id: string;
  slug: string;
  message?: string;
};

export type ListKnowledgeBasesParams = {
  workspaceId: string;
  limit: number;
  offset: number;
  keyword?: string;
  sortKey?: "name" | "createdAt";
  sortDirection?: "asc" | "desc";
};

export type ListKnowledgeBasesResult = {
  items: KnowledgeBaseListItem[];
  total: number;
  nextOffset: number | null;
};

export type GetKnowledgeBaseParams = {
  workspaceId: string;
  knowledgeBaseId: string;
};

export type GetKnowledgeBaseResult = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ListKnowledgeBaseDocumentsParams = {
  workspaceId: string;
  knowledgeBaseId: string;
  limit: number;
  offset: number;
};

export type ListKnowledgeBaseDocumentsResult = {
  items: KnowledgeBaseDocumentListItem[];
  total: number;
  nextOffset: number | null;
};

export type GetKnowledgeBaseDocumentUploadUrlParams = {
  workspaceId: string;
  knowledgeBaseId: string;
  filename: string;
  contentType: string;
  contentLength: number;
};

export type CreateKnowledgeBaseDocumentParams = {
  workspaceId: string;
  knowledgeBaseId: string;
  key: string;
  filename: string;
  contentType: string;
  contentLength: number;
  userId: string;
};

export type CreateKnowledgeBaseDocumentResult = {
  id: string;
  jobKey: string;
  message?: string;
};

export type DeleteKnowledgeBaseDocumentParams = {
  workspaceId: string;
  knowledgeBaseId: string;
  documentId: string;
};

export type DeleteKnowledgeBaseDocumentResult = {
  message?: string;
};
