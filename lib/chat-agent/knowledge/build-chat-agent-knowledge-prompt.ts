import {
  KNOWLEDGE_BASE_SEARCH_TOOL_NAME,
} from "@/lib/knowledge-base/constants";
import { searchKnowledgeBaseToolInputSchema } from "@/lib/knowledge-base/schema";

export type BuildChatAgentKnowledgePromptParams = {
  knowledgeBaseCount: number;
  citationsEnabled: boolean;
};

export function buildChatAgentKnowledgePrompt(
  params: BuildChatAgentKnowledgePromptParams,
): string {
  if (params.knowledgeBaseCount === 0) {
    return "";
  }

  const countLabel =
    params.knowledgeBaseCount === 1
      ? "1 knowledge base"
      : `${params.knowledgeBaseCount} knowledge bases`;

  const citationRule = params.citationsEnabled
    ? "When you use information from search results, cite inline as `[filename > section]`."
    : "Do not include source filenames, section names, or citation markers in your reply.";

  return [
    "# Knowledge bases",
    "",
    `This agent has access to ${countLabel} with indexed documents.`,
    "",
    "For questions about documented information (policies, procedures, product details, contracts, FAQs, pricing, schedules, etc.), call the `search_knowledge_base` tool before answering from memory.",
    "",
    "Tool usage:",
    "- Start with a focused `query`.",
    "- Set `rewriteQuery: true` when the question is vague, conversational, or needs clearer search phrasing.",
    "- Set `multiQuery: true` for broad, multi-part, or ambiguous questions that may match documents in different ways.",
    "- If the first search returns weak or empty results, retry with advanced options enabled.",
    "",
    citationRule,
  ].join("\n");
}

export function getSearchKnowledgeBaseToolName(): string {
  return KNOWLEDGE_BASE_SEARCH_TOOL_NAME;
}

export { searchKnowledgeBaseToolInputSchema };
