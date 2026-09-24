import {
  KNOWLEDGE_BASE_SEARCH_TOOL_NAME,
} from "@/lib/knowledge-base/constants";
import { searchKnowledgeBaseToolInputSchema } from "@/lib/knowledge-base/schema";
import type { AgentKnowledgeBaseRef } from "@/lib/knowledge-base/types";

export type BuildChatAgentKnowledgePromptParams = {
  knowledgeBases: Pick<AgentKnowledgeBaseRef, "name" | "description">[];
  citationsEnabled: boolean;
};

function formatKnowledgeBaseLine(
  knowledgeBase: BuildChatAgentKnowledgePromptParams["knowledgeBases"][number],
): string {
  const name = knowledgeBase.name.trim();
  const description = knowledgeBase.description?.trim();

  return description ? `- **${name}**: ${description}` : `- **${name}**`;
}

export function buildChatAgentKnowledgePrompt(
  params: BuildChatAgentKnowledgePromptParams,
): string {
  if (params.knowledgeBases.length === 0) {
    return "";
  }

  const toolName = `\`${KNOWLEDGE_BASE_SEARCH_TOOL_NAME}\``;

  const citationRule = params.citationsEnabled
    ? "When you use information from search results, cite inline as `[filename > section]`."
    : "Do not include source filenames, section names, or citation markers in your reply.";

  return [
    "# Knowledge bases",
    "",
    "This agent has access to the following knowledge bases with indexed documents:",
    "",
    ...params.knowledgeBases.map(formatKnowledgeBaseLine),
    "",
    `When the user asks about any topic covered by the knowledge bases above, you MUST call the ${toolName} tool and base your answer on its results. Do not answer these topics from memory.`,
    "",
    citationRule,
  ].join("\n");
}

export function getSearchKnowledgeBaseToolName(): string {
  return KNOWLEDGE_BASE_SEARCH_TOOL_NAME;
}

export { searchKnowledgeBaseToolInputSchema };
