export function getKnowledgeBaseDocumentViewHref(
  workspaceIndex: number,
  knowledgeBaseId: string,
  documentId: string,
): string {
  return `/w/${workspaceIndex}/knowledge-base/${knowledgeBaseId}/documents/${documentId}/view`;
}
