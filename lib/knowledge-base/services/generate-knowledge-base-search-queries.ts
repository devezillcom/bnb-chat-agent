import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

import {
  KNOWLEDGE_BASE_MULTI_QUERY_VARIANT_COUNT,
  KNOWLEDGE_BASE_QUERY_STRATEGY_MODEL,
} from "../constants";

const multiQueryResultSchema = z.object({
  queries: z.array(z.string().trim().min(1)).min(1).max(4),
});

export type GenerateKnowledgeBaseSearchQueriesParams = {
  query: string;
};

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const query of queries) {
    const normalized = query.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export async function generateKnowledgeBaseSearchQueries(
  params: GenerateKnowledgeBaseSearchQueriesParams,
): Promise<string[]> {
  const baseQuery = params.query.trim();
  const model = new ChatAnthropic({
    model: KNOWLEDGE_BASE_QUERY_STRATEGY_MODEL,
    temperature: 0.2,
  }).withStructuredOutput(multiQueryResultSchema);

  const result = await model.invoke([
    {
      role: "user",
      content: [
        "Generate alternative search queries for semantic retrieval over document chunks.",
        `Return ${KNOWLEDGE_BASE_MULTI_QUERY_VARIANT_COUNT} diverse variants plus keep the original intent.`,
        "Prefer concise keyword-rich phrasing. Support Vietnamese and English.",
        "",
        `Original query: ${baseQuery}`,
      ].join("\n"),
    },
  ]);

  return uniqueQueries([baseQuery, ...result.queries]).slice(
    0,
    KNOWLEDGE_BASE_MULTI_QUERY_VARIANT_COUNT + 1,
  );
}
