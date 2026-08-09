import "server-only";

import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

import { buildWorkspaceAgentCacheKey } from "@/lib/agents/utils/build-workspace-agent-cache-key";
import { createChatModel, parseChatModel } from "@/lib/langchain/models/create-chat-model";

import { chatAgentContextSchema, type ChatAgentContext } from "../schema";
import { buildChatAgentTools } from "../tools/build-chat-agent-tools";
import { getChatAgentCheckpointer } from "../utils/get-chat-agent-checkpointer";
import type { ChatAgentConfig } from "../schema";

type ChatAgent = Awaited<ReturnType<typeof buildChatAgent>>;

const agentCache = new Map<string, Promise<ChatAgent>>();
const agentCacheKeyByAgentId = new Map<string, string>();

function getDefaultChatModel() {
  return parseChatModel(process.env.CHAT_AGENT_MODEL);
}

async function buildChatAgent(config: ChatAgentConfig) {
  const [checkpointer, model] = await Promise.all([
    getChatAgentCheckpointer(),
    Promise.resolve(createChatModel(getDefaultChatModel(), { temperature: 0.5 })),
  ]);

  return createAgent({
    model,
    tools: await buildChatAgentTools({
      workspaceId: config.workspaceId,
      toolSlugs: config.toolSlugs,
    }),
    contextSchema: chatAgentContextSchema,
    middleware: [
      dynamicSystemPromptMiddleware<ChatAgentContext>(() => config.systemPrompt),
    ],
    checkpointer,
  });
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
