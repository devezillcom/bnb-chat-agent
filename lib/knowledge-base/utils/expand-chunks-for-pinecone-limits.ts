import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { KnowledgeBaseChunk } from "../types";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 900,
  chunkOverlap: 120,
});

export function getUtf8ByteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

export async function expandChunksForPineconeLimits(
  chunks: KnowledgeBaseChunk[],
  maxTextBytes: number,
): Promise<KnowledgeBaseChunk[]> {
  const expanded: KnowledgeBaseChunk[] = [];

  for (const chunk of chunks) {
    if (getUtf8ByteLength(chunk.text) <= maxTextBytes) {
      expanded.push(chunk);
      continue;
    }

    const parts = await splitter.splitText(chunk.text);
    const totalParts = parts.length;

    for (const [partIndex, text] of parts.entries()) {
      expanded.push({
        index: expanded.length,
        text,
        metadata: {
          ...chunk.metadata,
          sectionTitle: chunk.metadata.sectionTitle
            ? `${chunk.metadata.sectionTitle} (${partIndex + 1}/${totalParts})`
            : `Part ${partIndex + 1}/${totalParts}`,
        },
      });
    }
  }

  return expanded.map((chunk, index) => ({
    ...chunk,
    index,
  }));
}
