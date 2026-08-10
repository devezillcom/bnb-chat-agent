import "server-only";

import { tool } from "langchain";

import { searchKnowledgeBaseChunks } from "@/lib/knowledge-base/services/search-knowledge-base-chunks";
import { formatKnowledgeBaseSearchToolResult } from "@/lib/knowledge-base/utils/format-knowledge-base-search-tool-result";

import {
  buildChatAgentKnowledgePrompt,
  getSearchKnowledgeBaseToolName,
  searchKnowledgeBaseToolInputSchema,
} from "../knowledge/build-chat-agent-knowledge-prompt";

export type BuildChatAgentKnowledgeToolParams = {
  workspaceId: string;
  knowledgeBaseIds: string[];
};

export function buildChatAgentKnowledgeTool(
  params: BuildChatAgentKnowledgeToolParams,
) {
  if (params.knowledgeBaseIds.length === 0) {
    return null;
  }

  return tool(
    async (input) => {
      try {
        const result = await searchKnowledgeBaseChunks({
          workspaceId: params.workspaceId,
          knowledgeBaseIds: params.knowledgeBaseIds,
          query: input.query,
          rewriteQuery: input.rewriteQuery,
          multiQuery: input.multiQuery,
        });

        return JSON.stringify(
          formatKnowledgeBaseSearchToolResult({
            hits: result.hits,
            queriesUsed: result.queriesUsed,
            strategiesUsed: result.strategiesUsed,
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Knowledge base search failed.";

        return JSON.stringify({ error: message });
      }
    },
    {
      name: getSearchKnowledgeBaseToolName(),
      description: [
        "Search assigned knowledge bases for relevant document excerpts.",
        "Use for factual questions that may be answered by uploaded documents.",
        "Optional flags: rewriteQuery (clearer semantic query), multiQuery (multiple query variants).",
      ].join(" "),
      schema: searchKnowledgeBaseToolInputSchema,
    },
  );
}

export { buildChatAgentKnowledgePrompt };
