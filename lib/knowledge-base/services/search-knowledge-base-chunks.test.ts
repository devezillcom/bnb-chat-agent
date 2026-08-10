import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getPineconeIntegratedIndex,
  searchRecords,
  rewriteKnowledgeBaseSearchQuery,
  generateKnowledgeBaseSearchQueries,
} = vi.hoisted(() => ({
  getPineconeIntegratedIndex: vi.fn(),
  searchRecords: vi.fn(),
  rewriteKnowledgeBaseSearchQuery: vi.fn(),
  generateKnowledgeBaseSearchQueries: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/pinecone/utils/get-pinecone-client", () => ({
  getPineconeIntegratedIndex,
  isPineconeConfigured: () => true,
}));
vi.mock("./rewrite-knowledge-base-search-query", () => ({
  rewriteKnowledgeBaseSearchQuery,
}));
vi.mock("./generate-knowledge-base-search-queries", () => ({
  generateKnowledgeBaseSearchQueries,
}));

import { searchKnowledgeBaseChunks } from "./search-knowledge-base-chunks";

describe("searchKnowledgeBaseChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPineconeIntegratedIndex.mockResolvedValue({ searchRecords });
    searchRecords.mockResolvedValue({
      result: {
        hits: [
          {
            _id: "doc-1:0",
            _score: 0.91,
            fields: {
              chunk_text: "Check-in starts at 2 PM.",
              filename: "sop-checkin.pdf",
              sectionTitle: "Check-in",
              headingPath: "Operations > Check-in",
              documentId: "doc-1",
              knowledgeBaseId: "kb-1",
            },
          },
        ],
      },
    });
  });

  it("searches Pinecone with KB filter and rerank settings", async () => {
    const result = await searchKnowledgeBaseChunks({
      workspaceId: "workspace-1",
      knowledgeBaseIds: ["kb-1"],
      query: "check-in time",
    });

    expect(searchRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          topK: 20,
          inputs: { text: "check-in time" },
          filter: { knowledgeBaseId: { $in: ["kb-1"] } },
        }),
        rerank: expect.objectContaining({
          model: "bge-reranker-v2-m3",
          topN: 8,
          rankFields: ["chunk_text"],
        }),
      }),
    );
    expect(result.hits).toHaveLength(1);
    expect(result.queriesUsed).toEqual(["check-in time"]);
    expect(result.strategiesUsed).toEqual({
      rewriteQuery: false,
      multiQuery: false,
    });
  });

  it("uses advanced query strategies when requested", async () => {
    rewriteKnowledgeBaseSearchQuery.mockResolvedValue("property check-in policy");
    generateKnowledgeBaseSearchQueries.mockResolvedValue([
      "property check-in policy",
      "guest arrival time",
    ]);

    const result = await searchKnowledgeBaseChunks({
      workspaceId: "workspace-1",
      knowledgeBaseIds: ["kb-1"],
      query: "when can guests check in?",
      rewriteQuery: true,
      multiQuery: true,
    });

    expect(rewriteKnowledgeBaseSearchQuery).toHaveBeenCalledWith({
      query: "when can guests check in?",
    });
    expect(generateKnowledgeBaseSearchQueries).toHaveBeenCalledWith({
      query: "property check-in policy",
    });
    expect(searchRecords).toHaveBeenCalledTimes(2);
    expect(result.queriesUsed).toEqual([
      "property check-in policy",
      "guest arrival time",
    ]);
    expect(result.strategiesUsed).toEqual({
      rewriteQuery: true,
      multiQuery: true,
    });
  });
});
