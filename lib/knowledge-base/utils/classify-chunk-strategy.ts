import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

import {
  KNOWLEDGE_BASE_CHUNK_STRATEGIES,
  KNOWLEDGE_BASE_CLASSIFIER_MODEL,
  KNOWLEDGE_BASE_HEURISTIC_CLASSIFY_THRESHOLD,
  type KnowledgeBaseChunkStrategy,
} from "../constants";
import type { KnowledgeBaseDetectedLanguage } from "../constants";
import {
  looksLikeMarkdownHeadings,
} from "./chunk-document";

export type ClassifyChunkStrategyResult = {
  strategy: KnowledgeBaseChunkStrategy;
  reason: string;
  confidence: number;
  source: "heuristic" | "haiku";
};

const haikuClassificationSchema = z.object({
  strategy: z.enum(KNOWLEDGE_BASE_CHUNK_STRATEGIES),
  reason: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
});

function scoreStrategy(params: {
  filename: string;
  contentType: string;
  markdownSample: string;
  detectedLanguage: KnowledgeBaseDetectedLanguage;
}): ClassifyChunkStrategyResult | null {
  const sample = params.markdownSample;
  const lowerName = params.filename.toLowerCase();
  const lowerSample = sample.toLowerCase();

  if (
    /(hop-dong|hopdong|contract|agreement)/.test(lowerName) ||
    /(điều\s+\d+|khoản\s+\d+|article\s+\d+|section\s+\d+)/i.test(sample)
  ) {
    return {
      strategy: "chunk_contract_by_article",
      reason: "Detected legal contract structure.",
      confidence: 0.9,
      source: "heuristic",
    };
  }

  if (
    params.contentType.includes("csv") ||
    params.contentType.includes("spreadsheet") ||
    (sample.includes("|") && sample.split("\n").filter((line) => line.includes("|")).length >= 4)
  ) {
    return {
      strategy: "chunk_tabular_data",
      reason: "Detected tabular content.",
      confidence: 0.86,
      source: "heuristic",
    };
  }

  if (
    params.contentType.includes("presentation") ||
    /(slide|ppt)/.test(lowerName)
  ) {
    return {
      strategy: "chunk_slide_by_slide",
      reason: "Detected presentation-like structure.",
      confidence: 0.82,
      source: "heuristic",
    };
  }

  if (
    /(faq|cau-hoi|question)/.test(lowerName) ||
    /(?:^|\n)(?:\*\*)?(?:q|câu hỏi|question)(?:\*\*)?\s*[:.]/gim.test(sample)
  ) {
    return {
      strategy: "chunk_qa_pairs",
      reason: "Detected FAQ question-and-answer patterns.",
      confidence: 0.84,
      source: "heuristic",
    };
  }

  if (looksLikeMarkdownHeadings(sample)) {
    return {
      strategy: "chunk_markdown_by_heading",
      reason: "Detected structured markdown headings.",
      confidence: 0.8,
      source: "heuristic",
    };
  }

  if (params.detectedLanguage === "vi" && lowerSample.includes("điều")) {
    return {
      strategy: "chunk_contract_by_article",
      reason: "Detected Vietnamese legal article markers.",
      confidence: 0.78,
      source: "heuristic",
    };
  }

  return null;
}

async function classifyWithHaiku(params: {
  filename: string;
  contentType: string;
  markdownSample: string;
  detectedLanguage: KnowledgeBaseDetectedLanguage;
}): Promise<ClassifyChunkStrategyResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return {
      strategy: "chunk_recursive_by_token",
      reason: "Anthropic is not configured; used token fallback.",
      confidence: 0.5,
      source: "heuristic",
    };
  }

  const model = new ChatAnthropic({
    model: KNOWLEDGE_BASE_CLASSIFIER_MODEL,
    temperature: 0,
  });

  const response = await model.invoke([
    {
      role: "system",
      content:
        "Classify the best chunk strategy for RAG indexing. Return JSON only with keys strategy, reason, confidence.",
    },
    {
      role: "user",
      content: [
        `Filename: ${params.filename}`,
        `Content type: ${params.contentType}`,
        `Detected language: ${params.detectedLanguage}`,
        `Allowed strategies: ${KNOWLEDGE_BASE_CHUNK_STRATEGIES.join(", ")}`,
        "Markdown sample:",
        params.markdownSample.slice(0, 6000),
      ].join("\n"),
    },
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : response.content
          .map((part) => ("text" in part ? part.text : ""))
          .join("\n");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      strategy: "chunk_recursive_by_token",
      reason: "Haiku response was invalid; used token fallback.",
      confidence: 0.5,
      source: "haiku",
    };
  }

  const parsed = haikuClassificationSchema.safeParse(JSON.parse(jsonMatch[0]));
  if (!parsed.success) {
    return {
      strategy: "chunk_recursive_by_token",
      reason: "Haiku response failed validation; used token fallback.",
      confidence: 0.5,
      source: "haiku",
    };
  }

  return {
    ...parsed.data,
    source: "haiku",
  };
}

export async function classifyChunkStrategy(params: {
  filename: string;
  contentType: string;
  markdown: string;
  detectedLanguage: KnowledgeBaseDetectedLanguage;
}): Promise<ClassifyChunkStrategyResult> {
  const sample = params.markdown.slice(0, 8000);
  const heuristic = scoreStrategy({
    filename: params.filename,
    contentType: params.contentType,
    markdownSample: sample,
    detectedLanguage: params.detectedLanguage,
  });

  if (
    heuristic &&
    heuristic.confidence >= KNOWLEDGE_BASE_HEURISTIC_CLASSIFY_THRESHOLD
  ) {
    return heuristic;
  }

  const haiku = await classifyWithHaiku({
    filename: params.filename,
    contentType: params.contentType,
    markdownSample: sample,
    detectedLanguage: params.detectedLanguage,
  });

  return haiku;
}
