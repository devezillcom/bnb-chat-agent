import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPineconeIntegratedIndex, upsertRecords } = vi.hoisted(() => ({
  getPineconeIntegratedIndex: vi.fn(),
  upsertRecords: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/pinecone/utils/get-pinecone-client", () => ({
  getPineconeIntegratedIndex,
}));

import { indexKnowledgeBaseChunks } from "./index-knowledge-base-chunks";

describe("indexKnowledgeBaseChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPineconeIntegratedIndex.mockResolvedValue({ upsertRecords });
    upsertRecords.mockResolvedValue(undefined);
  });

  it("writes stable IDs and bounded chunk provenance metadata", async () => {
    const result = await indexKnowledgeBaseChunks({
      namespace: "workspace-1",
      workspaceId: "workspace-1",
      knowledgeBaseId: "kb-1",
      documentId: "document-1",
      filename: "guide.md",
      detectedLanguage: "vi",
      chunkStrategy: "chunk_markdown_by_heading",
      chunks: [
        {
          index: 3,
          text: "Document context: Guide\n\nNội dung",
          metadata: {
            strategy: "chunk_markdown_by_heading",
            headingPath: ["Guide"],
            sectionTitle: "Guide",
            sourceChunkIndex: 1,
            partIndex: 2,
            partCount: 4,
          },
        },
      ],
    });

    expect(result.recordIds).toEqual(["document-1:0"]);
    expect(upsertRecords).toHaveBeenCalledWith({
      records: [
        expect.objectContaining({
          id: "document-1:0",
          chunkIndex: 0,
          headingPath: "Guide",
          sourceChunkIndex: 1,
          partIndex: 2,
          partCount: 4,
        }),
      ],
    });
  });
});
