import {
  KNOWLEDGE_BASE_DOCUMENT_JOB_KEY_PREFIX,
  KNOWLEDGE_BASE_R2_PREFIX,
} from "../constants";

export function buildKnowledgeBaseDocumentJobKey(documentId: string): string {
  return `${KNOWLEDGE_BASE_DOCUMENT_JOB_KEY_PREFIX}-${documentId}`;
}

export function buildKnowledgeBaseUploadPrefix(params: {
  workspaceId: string;
  knowledgeBaseId: string;
}): string {
  return `${KNOWLEDGE_BASE_R2_PREFIX}/${params.workspaceId}/${params.knowledgeBaseId}/uploads`;
}

export function buildKnowledgeBaseArtifactPrefix(params: {
  workspaceId: string;
  knowledgeBaseId: string;
  documentId: string;
}): string {
  return `${KNOWLEDGE_BASE_R2_PREFIX}/${params.workspaceId}/${params.knowledgeBaseId}/${params.documentId}`;
}

export function buildKnowledgeBaseArtifactKey(params: {
  workspaceId: string;
  knowledgeBaseId: string;
  documentId: string;
  filename: string;
}): string {
  return `${buildKnowledgeBaseArtifactPrefix(params)}/${params.filename}`;
}
