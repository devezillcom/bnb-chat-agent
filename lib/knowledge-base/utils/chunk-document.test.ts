import { describe, expect, it } from "vitest";

import {
  KNOWLEDGE_BASE_CHUNK_TARGET_CHARACTERS,
  chunkContractByArticle,
  chunkDocument,
  chunkMarkdownByHeading,
  chunkQaPairs,
  chunkRecursiveByToken,
  chunkSlideBySlide,
  chunkTabularData,
  looksLikeMarkdownHeadings,
} from "./chunk-document";

describe("chunk-document", () => {
  it("detects headings but ignores fenced-code examples", () => {
    expect(
      looksLikeMarkdownHeadings("```\n# This is code\n```\n## Real heading"),
    ).toBe(true);
    expect(looksLikeMarkdownHeadings("```\n# This is code\n```")).toBe(false);
  });

  it("builds compact nested heading paths and keeps closing markers out of titles", () => {
    const chunks = chunkMarkdownByHeading(
      "# Parent #\nIntro\n### Child ###\nDetails",
      "chunk_markdown_by_heading",
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0].metadata.headingPath).toEqual(["Parent"]);
    expect(chunks[1].metadata.headingPath).toEqual(["Parent", "Child"]);
    expect(chunks[1].metadata.sectionTitle).toBe("Child");
  });

  it("does not split headings inside fenced code", () => {
    const chunks = chunkMarkdownByHeading(
      "# Guide\n```\n## Example\n```\nText",
      "chunk_markdown_by_heading",
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("## Example");
  });

  it("splits common Vietnamese and English legal article forms", () => {
    const chunks = chunkContractByArticle(
      "Mở đầu\nĐiều thứ 1. Phạm vi\nNội dung A\nKhoản 2.1 Trách nhiệm\nNội dung B\nArticle 3. Payment\nNội dung C",
      "chunk_contract_by_article",
    );

    expect(chunks).toHaveLength(4);
    expect(chunks.map((chunk) => chunk.metadata.sectionTitle)).toEqual([
      undefined,
      "Điều thứ 1. Phạm vi",
      "Khoản 2.1 Trách nhiệm",
      "Article 3. Payment",
    ]);
  });

  it("keeps prose and separates independent markdown tables", () => {
    const chunks = chunkTabularData(
      "# Pricing\nIntro prose.\n| Plan | Price |\n| --- | ---: |\n| Basic | 10 |\n| Pro | 20 |\n\n# Limits\nMore prose.\n| Item | Limit |\n| --- | ---: |\n| API | 100 |\nThis text has | one pipe only.",
      "chunk_tabular_data",
    );

    expect(chunks).toHaveLength(5);
    expect(chunks[0].text).toContain("Intro prose.");
    expect(chunks[1].text).toContain("| Plan | Price |");
    expect(chunks[1].text).not.toContain("| --- | ---: |");
    expect(chunks[2].text).toContain("More prose.");
    expect(chunks[3].text).toContain("| Item | Limit |");
    expect(chunks[3].metadata.headingPath).toEqual(["Limits"]);
    expect(chunks[4].text).toContain("This text has | one pipe only.");
  });

  it("repeats a table header for batches of twenty rows", () => {
    const rows = Array.from({ length: 21 }, (_, index) => `| ${index} |`);
    const chunks = chunkTabularData(
      ["| Id |", "| --- |", ...rows].join("\n"),
      "chunk_tabular_data",
    );

    expect(chunks).toHaveLength(2);
    expect(chunks.every((chunk) => chunk.text.startsWith("| Id |"))).toBe(true);
  });

  it("falls back to heading chunks when no valid markdown table exists", () => {
    const chunks = chunkTabularData(
      "# Notes\nThis prose uses | a pipe but is not a table.",
      "chunk_tabular_data",
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].metadata.sectionTitle).toBe("Notes");
  });

  it("does not treat a table example in a fenced code block as document data", () => {
    const chunks = chunkTabularData(
      "# Example\n```\n| Id | Name |\n| --- | --- |\n| 1 | Demo |\n```",
      "chunk_tabular_data",
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("| 1 | Demo |");
  });

  it("keeps slide titles and Q&A question titles", () => {
    const slides = chunkSlideBySlide(
      "# Slide 1\nOverview\n## Slide 2\nDetails",
      "chunk_slide_by_slide",
    );
    const qa = chunkQaPairs(
      "Q1: What is RAG?\nAn answer.\n\nCâu hỏi 2: Pinecone là gì?\nMột câu trả lời.",
      "chunk_qa_pairs",
    );

    expect(slides.map((chunk) => chunk.metadata.sectionTitle)).toEqual([
      "Slide 1",
      "Slide 2",
    ]);
    expect(qa).toHaveLength(2);
    expect(qa[1].metadata.sectionTitle).toContain("Câu hỏi 2");
  });

  it("falls back cleanly for one-slide and one-question documents", () => {
    const slide = chunkSlideBySlide(
      "# Only slide\nContent",
      "chunk_slide_by_slide",
    );
    const qa = chunkQaPairs(
      "# FAQ\nGeneral information",
      "chunk_qa_pairs",
    );

    expect(slide).toHaveLength(1);
    expect(slide[0].metadata.sectionTitle).toBe("Only slide");
    expect(qa).toHaveLength(1);
    expect(qa[0].metadata.sectionTitle).toBe("FAQ");
  });

  it("uses contiguous character-bounded fallback chunks", async () => {
    const chunks = await chunkRecursiveByToken(
      "information ".repeat(200),
      "chunk_recursive_by_token",
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.index)).toEqual(
      chunks.map((_, index) => index),
    );
    expect(
      chunks.every(
        (chunk) => chunk.text.length <= KNOWLEDGE_BASE_CHUNK_TARGET_CHARACTERS,
      ),
    ).toBe(true);
  });

  it("adds context and provenance to every size-aware semantic subchunk", async () => {
    const chunks = await chunkDocument({
      strategy: "chunk_markdown_by_heading",
      markdown: `# Parent\n## Child\n${"Nội dung có thể truy xuất. ".repeat(150)}`,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((chunk) => chunk.index)).toEqual(
      chunks.map((_, index) => index),
    );
    expect(
      chunks.every((chunk) =>
        chunk.text.startsWith("Document context: Parent > Child"),
      ),
    ).toBe(true);
    expect(chunks[0].metadata.partIndex).toBe(0);
    expect(chunks.at(-1)?.metadata.partCount).toBe(chunks.length);
    expect(
      chunks.every(
        (chunk) =>
          chunk.text.length <=
          KNOWLEDGE_BASE_CHUNK_TARGET_CHARACTERS +
            "Document context: Parent > Child\n\n".length,
      ),
    ).toBe(true);
  });

  it("returns no chunks for whitespace-only input", async () => {
    await expect(
      chunkDocument({
        strategy: "chunk_recursive_by_token",
        markdown: " \n\t ",
      }),
    ).resolves.toEqual([]);
  });
});
