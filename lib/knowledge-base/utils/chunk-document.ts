import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { KnowledgeBaseChunkStrategy } from "../constants";
import type { KnowledgeBaseChunk } from "../types";

export const KNOWLEDGE_BASE_CHUNK_TARGET_CHARACTERS = 900;
export const KNOWLEDGE_BASE_CHUNK_OVERLAP_CHARACTERS = 120;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: KNOWLEDGE_BASE_CHUNK_TARGET_CHARACTERS,
  chunkOverlap: KNOWLEDGE_BASE_CHUNK_OVERLAP_CHARACTERS,
});

type MarkdownHeading = {
  level: number;
  title: string;
};

function parseAtxHeading(line: string): MarkdownHeading | null {
  const match = line.match(/^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/);
  if (!match) {
    return null;
  }

  return {
    level: match[1].length,
    title: match[2].trim(),
  };
}

function normalizeHeadingPath(path: string[], heading: MarkdownHeading): string[] {
  const parentPath = path.slice(0, Math.min(path.length, heading.level - 1));
  return [...parentPath, heading.title];
}

function getHeadingPathBeforeLine(lines: string[], endIndex: number): string[] {
  let headingPath: string[] = [];
  let fenceMarker: "`" | "~" | null = null;

  for (let index = 0; index < endIndex; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      if (!fenceMarker) {
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        fenceMarker = null;
      }
      continue;
    }

    if (fenceMarker) {
      continue;
    }

    const heading = parseAtxHeading(line);
    if (heading) {
      headingPath = normalizeHeadingPath(headingPath, heading);
    }
  }

  return headingPath;
}

function createChunks(
  parts: Array<Omit<KnowledgeBaseChunk, "index">>,
): KnowledgeBaseChunk[] {
  return parts
    .filter((chunk) => chunk.text.trim())
    .map((chunk, index) => ({ ...chunk, index }));
}

function isMarkdownTableRow(line: string): boolean {
  return (line.match(/(?<!\\)\|/g)?.length ?? 0) >= 2;
}

function isMarkdownTableDivider(line: string): boolean {
  return (
    line.includes("|") &&
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line)
  );
}

function getContextPrefix(metadata: KnowledgeBaseChunk["metadata"]): string {
  const headingPath = metadata.headingPath?.filter(Boolean).join(" > ");
  const context = headingPath ?? metadata.sectionTitle;
  if (!context) {
    return "";
  }

  return `Document context: ${context.slice(0, 400)}`;
}

async function splitChunksForRetrieval(
  chunks: KnowledgeBaseChunk[],
): Promise<KnowledgeBaseChunk[]> {
  const splitChunks: KnowledgeBaseChunk[] = [];

  for (const chunk of chunks) {
    const contextPrefix = getContextPrefix(chunk.metadata);
    const contentBudget = Math.max(
      200,
      KNOWLEDGE_BASE_CHUNK_TARGET_CHARACTERS - contextPrefix.length - 2,
    );
    const contentSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: contentBudget,
      chunkOverlap: Math.min(
        KNOWLEDGE_BASE_CHUNK_OVERLAP_CHARACTERS,
        Math.floor(contentBudget / 4),
      ),
    });
    const parts = await contentSplitter.splitText(chunk.text);
    const totalParts = parts.length;

    for (const [partIndex, part] of parts.entries()) {
      splitChunks.push({
        index: splitChunks.length,
        text: contextPrefix ? `${contextPrefix}\n\n${part}` : part,
        metadata: {
          ...chunk.metadata,
          sourceChunkIndex: chunk.index,
          partIndex,
          partCount: totalParts,
        },
      });
    }
  }

  return splitChunks;
}

export function looksLikeMarkdownHeadings(markdown: string): boolean {
  let fenceMarker: "`" | "~" | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      fenceMarker = fenceMarker === marker ? null : fenceMarker ?? marker;
      continue;
    }

    if (!fenceMarker && parseAtxHeading(line)) {
      return true;
    }
  }

  return false;
}

export function chunkMarkdownByHeading(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): KnowledgeBaseChunk[] {
  const lines = markdown.split(/\r?\n/);
  const chunks: KnowledgeBaseChunk[] = [];
  const headingPath: string[] = [];
  let buffer: string[] = [];
  let sectionTitle: string | undefined;
  let fenceMarker: "`" | "~" | null = null;

  function flush() {
    const text = buffer.join("\n").trim();
    if (!text || (!text.includes("\n") && parseAtxHeading(text))) {
      buffer = [];
      return;
    }

    chunks.push({
      index: chunks.length,
      text,
      metadata: {
        strategy,
        headingPath: [...headingPath],
        sectionTitle,
      },
    });
    buffer = [];
  }

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      fenceMarker = fenceMarker === marker ? null : fenceMarker ?? marker;
      buffer.push(line);
      continue;
    }

    const heading = fenceMarker ? null : parseAtxHeading(line);
    if (heading) {
      flush();
      headingPath.splice(0, headingPath.length, ...normalizeHeadingPath(headingPath, heading));
      sectionTitle = heading.title;
      buffer.push(line);
      continue;
    }

    buffer.push(line);
  }

  flush();
  return chunks;
}

export function chunkContractByArticle(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): KnowledgeBaseChunk[] {
  const marker =
    "(?:Điều|Khoản|Mục|Article|Section)\\s+(?:(?:thứ)\\s+)?(?:\\d+(?:\\.\\d+)*|[IVXLCDM]+|[A-Z])\\b";
  const pattern = new RegExp(`(?=^(?:#{1,6}\\s+)?${marker}.*$)`, "gim");
  const parts = markdown.split(pattern).map((part) => part.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  return parts.map((text, index) => {
    const titleMatch = text.match(
      new RegExp(`^(?:#{1,6}\\s+)?(${marker}[^\\n]*)`, "im"),
    );

    return {
      index,
      text,
      metadata: {
        strategy,
        sectionTitle: titleMatch?.[1]?.trim(),
      },
    };
  });
}

export function chunkTabularData(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): KnowledgeBaseChunk[] {
  const lines = markdown.split(/\r?\n/);
  const chunks: Array<Omit<KnowledgeBaseChunk, "index">> = [];
  const batchSize = 20;
  let foundTable = false;
  let proseStart = 0;
  let lineIndex = 0;
  let fenceMarker: "`" | "~" | null = null;

  function addProse(start: number, end: number) {
    const prose = lines.slice(start, end).join("\n").trim();
    if (!prose) {
      return;
    }

    chunks.push(
      ...chunkMarkdownByHeading(prose, strategy).map((chunk) => ({
        text: chunk.text,
        metadata: chunk.metadata,
      })),
    );
  }

  while (lineIndex < lines.length - 1) {
    const fenceMatch = lines[lineIndex].match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      fenceMarker = fenceMarker === marker ? null : fenceMarker ?? marker;
      lineIndex += 1;
      continue;
    }

    if (
      fenceMarker ||
      !isMarkdownTableRow(lines[lineIndex]) ||
      !isMarkdownTableDivider(lines[lineIndex + 1])
    ) {
      lineIndex += 1;
      continue;
    }

    foundTable = true;
    addProse(proseStart, lineIndex);
    const header = lines[lineIndex].trim();
    const headingPath = getHeadingPathBeforeLine(lines, lineIndex);
    const sectionTitle = headingPath.at(-1) ?? "table";
    const rows: string[] = [];
    lineIndex += 2;

    while (lineIndex < lines.length && isMarkdownTableRow(lines[lineIndex])) {
      rows.push(lines[lineIndex].trim());
      lineIndex += 1;
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += batchSize) {
      chunks.push({
        text: [header, ...rows.slice(rowIndex, rowIndex + batchSize)]
          .join("\n")
          .trim(),
        metadata: {
          strategy,
          headingPath: headingPath.length ? headingPath : undefined,
          sectionTitle,
        },
      });
    }

    proseStart = lineIndex;
  }

  if (!foundTable) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  addProse(proseStart, lines.length);
  return createChunks(chunks);
}

export function chunkSlideBySlide(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): KnowledgeBaseChunk[] {
  const parts = markdown
    .split(/\n(?=^#{1,2}[ \t]+)/m)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  return parts.map((text, index) => {
    const titleMatch = text.match(/^#{1,2}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/m);
    return {
      index,
      text,
      metadata: {
        strategy,
        sectionTitle: titleMatch?.[1]?.trim(),
      },
    };
  });
}

export function chunkQaPairs(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): KnowledgeBaseChunk[] {
  const pattern =
    /(?=^(?:[-*]\s*)?(?:\*\*)?(?:(?:q|question)\s*\d*|câu\s+hỏi\s*\d*|câu\s+\d+|faq\s*\d+)(?:\*\*)?\s*[:.)-]?\s*.+$)/gim;
  const parts = markdown.split(pattern).map((part) => part.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  return parts.map((text, index) => {
    const question = text.split(/\r?\n/, 1)[0].replace(/\*\*/g, "").trim();
    return {
      index,
      text,
      metadata: { strategy, sectionTitle: question },
    };
  });
}

export async function chunkRecursiveByToken(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): Promise<KnowledgeBaseChunk[]> {
  const parts = await splitter.splitText(markdown);

  return parts.map((text, index) => ({
    index,
    text,
    metadata: { strategy },
  }));
}

export async function chunkDocument(params: {
  markdown: string;
  strategy: KnowledgeBaseChunkStrategy;
}): Promise<KnowledgeBaseChunk[]> {
  const logicalChunks = await (async () => {
    switch (params.strategy) {
    case "chunk_contract_by_article":
      return chunkContractByArticle(params.markdown, params.strategy);
    case "chunk_tabular_data":
      return chunkTabularData(params.markdown, params.strategy);
    case "chunk_slide_by_slide":
      return chunkSlideBySlide(params.markdown, params.strategy);
    case "chunk_qa_pairs":
      return chunkQaPairs(params.markdown, params.strategy);
    case "chunk_recursive_by_token":
      return chunkRecursiveByToken(params.markdown, params.strategy);
    case "chunk_markdown_by_heading":
    default:
      return chunkMarkdownByHeading(params.markdown, params.strategy);
    }
  })();

  return splitChunksForRetrieval(logicalChunks);
}
