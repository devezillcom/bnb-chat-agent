import "server-only";

import { createAgent, dynamicSystemPromptMiddleware, summarizationMiddleware } from "langchain";

import { buildWorkspaceAgentCacheKey } from "@/lib/agents/utils/build-workspace-agent-cache-key";
import { createChatModel, parseChatModel } from "@/lib/langchain/models/create-chat-model";

import {
  CHAT_AGENT_SUMMARIZATION_KEEP_MESSAGES,
  CHAT_AGENT_SUMMARIZATION_TRIGGER_TOKENS,
} from "../constants";
import { chatAgentRunContextSchema, type ChatAgentConfig } from "../schema";
import { buildChatAgentKnowledgeTool } from "../tools/build-chat-agent-knowledge-tool";
import { buildChatAgentTools } from "../tools/build-chat-agent-tools";
import { getChatAgentCheckpointer } from "../utils/get-chat-agent-checkpointer";

type ChatAgent = Awaited<ReturnType<typeof buildChatAgent>>;

const agentCache = new Map<string, Promise<ChatAgent>>();
const agentCacheKeyByAgentId = new Map<string, string>();

function getSummarizationModel() {
  return parseChatModel(process.env.CHAT_AGENT_MODEL, "gpt-4o");
}

async function buildChatAgent(config: ChatAgentConfig) {
  const [checkpointer, model, summarizationModel, workspaceTools, knowledgeTool] =
    await Promise.all([
      getChatAgentCheckpointer(),
      Promise.resolve(createChatModel(config.model, { temperature: 0.5 })),
      Promise.resolve(createChatModel(getSummarizationModel(), { temperature: 0.2 })),
      buildChatAgentTools({
        workspaceId: config.workspaceId,
        toolSlugs: config.toolSlugs,
      }),
      Promise.resolve(
        buildChatAgentKnowledgeTool({
          workspaceId: config.workspaceId,
          knowledgeBaseIds: config.knowledgeBaseIds,
        }),
      ),
    ]);

  const tools = knowledgeTool
    ? [...workspaceTools, knowledgeTool]
    : workspaceTools;

  return createAgent({
    model,
    tools,
    contextSchema: chatAgentRunContextSchema,
    middleware: [
      dynamicSystemPromptMiddleware(() => config.systemPrompt),
      summarizationMiddleware({
        model: summarizationModel,
        trigger: { tokens: CHAT_AGENT_SUMMARIZATION_TRIGGER_TOKENS },
        keep: { messages: CHAT_AGENT_SUMMARIZATION_KEEP_MESSAGES },
      }),
    ],
    checkpointer,
  });
}

export function invalidateChatAgentCache(agentId: string) {
  agentCacheKeyByAgentId.delete(agentId);

  const prefix = `${agentId}:`;
  for (const cacheKey of agentCache.keys()) {
    if (cacheKey.startsWith(prefix)) {
      agentCache.delete(cacheKey);
    }
  }
}

export function getChatAgent(config: ChatAgentConfig): Promise<ChatAgent> {
  const cacheKey = buildWorkspaceAgentCacheKey(config);
  const cachedAgent = agentCache.get(cacheKey);

  if (cachedAgent) {
    return cachedAgent;
  }

  const previousCacheKey = agentCacheKeyByAgentId.get(config.agentId);
  if (previousCacheKey && previousCacheKey !== cacheKey) {
    agentCache.delete(previousCacheKey);
  }

  const agentPromise = buildChatAgent(config);
  agentCache.set(cacheKey, agentPromise);
  agentCacheKeyByAgentId.set(config.agentId, cacheKey);

  return agentPromise;
}
