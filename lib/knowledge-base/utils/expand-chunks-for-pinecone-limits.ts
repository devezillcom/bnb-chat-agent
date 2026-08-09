import type { KnowledgeBaseChunk } from "../types";

export function getUtf8ByteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function getMetadataByteLength(metadata: KnowledgeBaseChunk["metadata"]): number {
  return getUtf8ByteLength(JSON.stringify(metadata));
}

function splitTextByUtf8Bytes(text: string, maxBytes: number): string[] {
  if (maxBytes <= 0) {
    throw new RangeError("Pinecone metadata leaves no room for chunk text.");
  }

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;

  for (const character of text) {
    const characterBytes = getUtf8ByteLength(character);
    if (characterBytes > maxBytes) {
      throw new RangeError("A character exceeds the Pinecone text byte budget.");
    }

    if (current && currentBytes + characterBytes > maxBytes) {
      parts.push(current.trimEnd());
      current = "";
      currentBytes = 0;
    }

    current += character;
    currentBytes += characterBytes;
  }

  if (current) {
    parts.push(current.trimEnd());
  }

  return parts;
}

export async function expandChunksForPineconeLimits(
  chunks: KnowledgeBaseChunk[],
  maxRecordBytes: number,
): Promise<KnowledgeBaseChunk[]> {
  const expanded: KnowledgeBaseChunk[] = [];

  for (const chunk of chunks) {
    const expandedMetadataBudget = {
      ...chunk.metadata,
      sourceChunkIndex: Number.MAX_SAFE_INTEGER,
      partIndex: Number.MAX_SAFE_INTEGER,
      partCount: Number.MAX_SAFE_INTEGER,
    };
    const textBudget =
      maxRecordBytes - getMetadataByteLength(expandedMetadataBudget);
    if (getUtf8ByteLength(chunk.text) <= textBudget) {
      expanded.push(chunk);
      continue;
    }

    const parts = splitTextByUtf8Bytes(chunk.text, textBudget);
    const totalParts = parts.length;

    for (const [partIndex, text] of parts.entries()) {
      expanded.push({
        index: expanded.length,
        text,
        metadata: {
          ...chunk.metadata,
          sourceChunkIndex: chunk.metadata.sourceChunkIndex ?? chunk.index,
          partIndex,
          partCount: totalParts,
        },
      });
    }
  }

  return expanded.map((chunk, index) => {
    const recordBytes =
      getUtf8ByteLength(chunk.text) + getMetadataByteLength(chunk.metadata);
    if (recordBytes > maxRecordBytes) {
      throw new RangeError("Expanded chunk exceeds the Pinecone byte limit.");
    }

    return { ...chunk, index };
  });
}
