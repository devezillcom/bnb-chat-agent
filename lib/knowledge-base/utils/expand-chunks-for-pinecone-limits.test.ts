import { describe, expect, it } from "vitest";

import type { KnowledgeBaseChunk } from "../types";
import {
  expandChunksForPineconeLimits,
  getUtf8ByteLength,
} from "./expand-chunks-for-pinecone-limits";

function createChunk(text: string): KnowledgeBaseChunk {
  return {
    index: 7,
    text,
    metadata: {
      strategy: "chunk_markdown_by_heading",
      sectionTitle: "Tiêu đề",
    },
  };
}

describe("expand-chunks-for-pinecone-limits", () => {
  it("measures UTF-8 rather than JavaScript character length", () => {
    expect(getUtf8ByteLength("abc")).toBe(3);
    expect(getUtf8ByteLength("đ")).toBeGreaterThan(1);
  });

  it("keeps chunks under the record limit intact", async () => {
    const [chunk] = await expandChunksForPineconeLimits(
      [createChunk("short text")],
      200,
    );

    expect(chunk.text).toBe("short text");
    expect(chunk.index).toBe(0);
    expect(chunk.metadata.partIndex).toBeUndefined();
  });

  it("splits multibyte text into record-safe parts with provenance", async () => {
    const maxRecordBytes = 180;
    const chunks = await expandChunksForPineconeLimits(
      [createChunk("đ".repeat(240))],
      maxRecordBytes,
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.index)).toEqual(
      chunks.map((_, index) => index),
    );
    expect(chunks.map((chunk) => chunk.metadata.partIndex)).toEqual(
      chunks.map((_, index) => index),
    );
    expect(
      chunks.every(
        (chunk) =>
          getUtf8ByteLength(chunk.text) +
            getUtf8ByteLength(JSON.stringify(chunk.metadata)) <=
          maxRecordBytes,
      ),
    ).toBe(true);
    expect(
      chunks.every(
        (chunk) =>
          chunk.metadata.sourceChunkIndex === 7 &&
          chunk.metadata.partCount === chunks.length,
      ),
    ).toBe(true);
  });

  it("fails clearly when metadata alone consumes the byte budget", async () => {
    await expect(
      expandChunksForPineconeLimits([createChunk("text")], 1),
    ).rejects.toThrow("Pinecone metadata leaves no room");
  });
});
