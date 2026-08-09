import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import type { KnowledgeBaseChunkStrategy } from "../constants";
import type { KnowledgeBaseChunk } from "../types";

export function looksLikeMarkdownHeadings(markdown: string): boolean {
  return /^#{1,6}\s+.+$/m.test(markdown);
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

  function flush() {
    const text = buffer.join("\n").trim();
    if (!text) {
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
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      flush();
      const level = match[1].length;
      const title = match[2].trim();
      headingPath.splice(level - 1);
      headingPath[level - 1] = title;
      sectionTitle = title;
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
  const pattern =
    /(?=^(?:#{1,3}\s+)?(?:Điều|ĐIỀU|Article|ARTICLE|Mục|MỤC|Section|SECTION)\s+\d+\b.*$)/gm;
  const parts = markdown.split(pattern).map((part) => part.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  return parts.map((text, index) => {
    const titleMatch = text.match(
      /^(?:#{1,3}\s+)?((?:Điều|ĐIỀU|Article|ARTICLE|Mục|MỤC|Section|SECTION)\s+\d+[^\n]*)/m,
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
  const tableLines = lines.filter((line) => line.includes("|"));
  if (tableLines.length < 2) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  const chunks: KnowledgeBaseChunk[] = [];
  const batchSize = 20;
  const header = tableLines[0];

  for (let i = 1; i < tableLines.length; i += batchSize) {
    const slice = tableLines.slice(i, i + batchSize);
    chunks.push({
      index: chunks.length,
      text: [header, ...slice].join("\n"),
      metadata: {
        strategy,
        sectionTitle: "table",
      },
    });
  }

  return chunks;
}

export function chunkSlideBySlide(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): KnowledgeBaseChunk[] {
  const parts = markdown
    .split(/\n(?=^#{1,2}\s+)/m)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  return parts.map((text, index) => {
    const titleMatch = text.match(/^#{1,2}\s+(.+)$/m);
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
    /(?=^(?:\*\*)?(?:Q|Câu hỏi|Question)(?:\*\*)?\s*[:.]?\s*.+$)/gim;
  const parts = markdown.split(pattern).map((part) => part.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return chunkMarkdownByHeading(markdown, strategy);
  }

  return parts.map((text, index) => ({
    index,
    text,
    metadata: { strategy },
  }));
}

export async function chunkRecursiveByToken(
  markdown: string,
  strategy: KnowledgeBaseChunkStrategy,
): Promise<KnowledgeBaseChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 120,
  });
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
}
