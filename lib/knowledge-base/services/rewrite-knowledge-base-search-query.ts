import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

import { KNOWLEDGE_BASE_QUERY_STRATEGY_MODEL } from "../constants";

const rewriteResultSchema = z.object({
  query: z.string().trim().min(1),
});

export type RewriteKnowledgeBaseSearchQueryParams = {
  query: string;
};

export async function rewriteKnowledgeBaseSearchQuery(
  params: RewriteKnowledgeBaseSearchQueryParams,
): Promise<string> {
  const model = new ChatAnthropic({
    model: KNOWLEDGE_BASE_QUERY_STRATEGY_MODEL,
    temperature: 0,
  }).withStructuredOutput(rewriteResultSchema);

  const result = await model.invoke([
    {
      role: "user",
      content: [
        "Rewrite the following search query for semantic search over document chunks.",
        "Make it specific, self-contained, and suitable for multilingual retrieval.",
        "Return only the rewritten query text.",
        "",
        `Query: ${params.query.trim()}`,
      ].join("\n"),
    },
  ]);

  return result.query.trim();
}
