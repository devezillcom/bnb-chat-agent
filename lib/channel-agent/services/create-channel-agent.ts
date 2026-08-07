import "server-only";

import { createAgent, dynamicSystemPromptMiddleware, summarizationMiddleware } from "langchain";

import {
  createChatModel,
  parseChatModel,
} from "@/lib/langchain/models/create-chat-model";
import { getChatAgentCheckpointer } from "@/lib/chat-agent/utils/get-chat-agent-checkpointer";

import {
  CHANNEL_AGENT_SUMMARIZATION_KEEP_MESSAGES,
  CHANNEL_AGENT_SUMMARIZATION_TRIGGER_TOKENS,
} from "../constants";
import type { ChannelAgentConfig } from "../schema";
import type { ChannelAgentContext } from "../schema";
import { channelAgentContextSchema } from "../schema";

type ChannelAgent = Awaited<ReturnType<typeof buildChannelAgent>>;

const agentCache = new Map<string, Promise<ChannelAgent>>();

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
    tools: [],
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
  const cacheKey = `${config.agentId}:${config.systemPrompt}`;

  if (!agentCache.has(cacheKey)) {
    agentCache.set(cacheKey, buildChannelAgent(config));
  }

  return agentCache.get(cacheKey)!;
}
