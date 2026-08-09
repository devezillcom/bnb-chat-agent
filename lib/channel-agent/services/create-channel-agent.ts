import "server-only";

import { createAgent, dynamicSystemPromptMiddleware, summarizationMiddleware } from "langchain";

import {
  createChatModel,
  parseChatModel,
} from "@/lib/langchain/models/create-chat-model";
import { getChatAgentCheckpointer } from "@/lib/chat-agent/utils/get-chat-agent-checkpointer";
import { buildChatAgentTools } from "@/lib/chat-agent/tools/build-chat-agent-tools";

import {
  CHANNEL_AGENT_SUMMARIZATION_KEEP_MESSAGES,
  CHANNEL_AGENT_SUMMARIZATION_TRIGGER_TOKENS,
} from "../constants";
import type { ChannelAgentConfig } from "../schema";
import type { ChannelAgentContext } from "../schema";
import { channelAgentContextSchema } from "../schema";
import { buildWorkspaceAgentCacheKey } from "@/lib/agents/utils/build-workspace-agent-cache-key";

type ChannelAgent = Awaited<ReturnType<typeof buildChannelAgent>>;

const agentCache = new Map<string, Promise<ChannelAgent>>();
const agentCacheKeyByAgentId = new Map<string, string>();

function getDefaultChannelAgentModel() {
  return parseChatModel(process.env.CHANNEL_AGENT_MODEL ?? process.env.CHAT_AGENT_MODEL);
}

function getSummarizationModel() {
  return parseChatModel(
    process.env.CHANNEL_AGENT_SUMMARIZATION_MODEL ?? process.env.CHAT_AGENT_MODEL,
    "gpt-4o",
  );
}

async function buildChannelAgent(config: ChannelAgentConfig) {
  const [checkpointer, model, summarizationModel] = await Promise.all([
    getChatAgentCheckpointer(),
    Promise.resolve(createChatModel(getDefaultChannelAgentModel(), { temperature: 0.4 })),
    Promise.resolve(createChatModel(getSummarizationModel(), { temperature: 0.2 })),
  ]);

  return createAgent({
    model,
    tools: await buildChatAgentTools({
      workspaceId: config.workspaceId,
      toolSlugs: config.toolSlugs,
    }),
    contextSchema: channelAgentContextSchema,
    middleware: [
      dynamicSystemPromptMiddleware<ChannelAgentContext>(() => config.systemPrompt),
      summarizationMiddleware({
        model: summarizationModel,
        trigger: { tokens: CHANNEL_AGENT_SUMMARIZATION_TRIGGER_TOKENS },
        keep: { messages: CHANNEL_AGENT_SUMMARIZATION_KEEP_MESSAGES },
      }),
    ],
    checkpointer,
  });
}

export function getChannelAgent(config: ChannelAgentConfig): Promise<ChannelAgent> {
  const cacheKey = buildWorkspaceAgentCacheKey(config);
  const cachedAgent = agentCache.get(cacheKey);

  if (cachedAgent) {
    return cachedAgent;
  }

  const previousCacheKey = agentCacheKeyByAgentId.get(config.agentId);
  if (previousCacheKey && previousCacheKey !== cacheKey) {
    agentCache.delete(previousCacheKey);
  }

  const agentPromise = buildChannelAgent(config);
  agentCache.set(cacheKey, agentPromise);
  agentCacheKeyByAgentId.set(config.agentId, cacheKey);

  return agentPromise;
}
