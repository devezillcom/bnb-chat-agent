import type { KnowledgeBaseDocument } from "@/db/schema";

export function collectKnowledgeBaseDocumentR2Keys(
  document: Pick<
    KnowledgeBaseDocument,
    | "sourceR2Key"
    | "markdownR2Key"
    | "chunksR2Key"
    | "indexResultR2Key"
    | "pipelineLogR2Key"
  >,
): string[] {
  return [
    document.sourceR2Key,
    document.markdownR2Key,
    document.chunksR2Key,
    document.indexResultR2Key,
    document.pipelineLogR2Key,
  ].filter((key): key is string => Boolean(key?.trim()));
}
