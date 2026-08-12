import { z } from "zod";

export type ChatModelProvider = "openai" | "anthropic" | "deepseek";

export const chatModelIds = [
  "gpt-5.5",
  "gpt-5.5-pro",
  "gpt-4.1",
  "gpt-4o",
  "o3-mini",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "deepseek-v4-flash",
  "deepseek-v4-pro",
] as const;

export type ChatModelId = (typeof chatModelIds)[number];

export const defaultChatModel: ChatModelId = "claude-sonnet-4-6";

/** Zod schema for registry chat model ids — keep in sync with `chatModelIds`. */
export const chatModelIdSchema = z.enum(chatModelIds, {
  error: "Select a valid chat model.",
});

export type ChatModelDefinition = {
  label: string;
  provider: ChatModelProvider;
  /** Provider API model name passed to ChatOpenAI / ChatAnthropic / ChatDeepSeek. */
  modelName: string;
  /** When false, omit temperature (reasoning models). */
  supportsTemperature: boolean;
  /** Purpose and approximate API pricing (USD per 1M tokens). */
  description: string;
};

/**
 * Central registry for LangChain chat models used across agents and tools.
 * To add a model: extend `chatModelIds` / `chatModelIdSchema` and add an entry here.
 */
export const chatModelRegistry: Record<ChatModelId, ChatModelDefinition> = {
  "gpt-5.5": {
    label: "GPT-5.5",
    provider: "openai",
    modelName: "gpt-5.5",
    supportsTemperature: false,
    description:
      "OpenAI frontier reasoning model for complex agentic research, tool use, and multi-step analysis. ~$5/MTok input, ~$30/MTok output (reasoning tokens billed at output rate).",
  },
  "gpt-5.5-pro": {
    label: "GPT-5.5 Pro",
    provider: "openai",
    modelName: "gpt-5.5-pro",
    supportsTemperature: false,
    description:
      "OpenAI maximum-capability reasoning model for the hardest research tasks. ~$30/MTok input, ~$180/MTok output — highest cost, best accuracy.",
  },
  "gpt-4.1": {
    label: "GPT-4.1",
    provider: "openai",
    modelName: "gpt-4.1",
    supportsTemperature: true,
    description:
      "Balanced OpenAI production model with 1M-token context for long documents and reliable everyday research. ~$2/MTok input, ~$8/MTok output.",
  },
  "gpt-4o": {
    label: "GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    supportsTemperature: true,
    description:
      "Legacy OpenAI multimodal model for general tasks. ~$2.50/MTok input, ~$10/MTok output. Prefer GPT-4.1 unless you need GPT-4o specifically.",
  },
  "o3-mini": {
    label: "o3-mini",
    provider: "openai",
    modelName: "o3-mini",
    supportsTemperature: false,
    description:
      "Lightweight OpenAI reasoning model for structured analysis on a budget. ~$1.10/MTok input, ~$4.40/MTok output (reasoning tokens add to cost).",
  },
  "claude-sonnet-4-6": {
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    modelName: "claude-sonnet-4-6",
    supportsTemperature: true,
    description:
      "Anthropic balanced model for coding, agents, and everyday research with 1M-token context. ~$3/MTok input, ~$15/MTok output.",
  },
  "claude-opus-4-6": {
    label: "Claude Opus 4.6",
    provider: "anthropic",
    modelName: "claude-opus-4-6",
    supportsTemperature: true,
    description:
      "Anthropic flagship for the most complex research, long-horizon reasoning, and high-stakes analysis. ~$5/MTok input, ~$25/MTok output.",
  },
  "deepseek-v4-flash": {
    label: "DeepSeek V4 Flash",
    provider: "deepseek",
    modelName: "deepseek-v4-flash",
    supportsTemperature: true,
    description:
      "DeepSeek cost-efficient V4 model for high-volume chat, coding help, and lightweight agents with 1M-token context. ~$0.14/MTok input, ~$0.28/MTok output.",
  },
  "deepseek-v4-pro": {
    label: "DeepSeek V4 Pro",
    provider: "deepseek",
    modelName: "deepseek-v4-pro",
    supportsTemperature: true,
    description:
      "DeepSeek higher-capability V4 model for complex reasoning, coding, and agentic workflows with 1M-token context. ~$0.435/MTok input, ~$0.87/MTok output.",
  },
};

export function getChatModelDefinition(model: ChatModelId): ChatModelDefinition {
  return chatModelRegistry[model];
}

export function parseChatModel(
  value: string | undefined,
  fallback: ChatModelId = defaultChatModel,
): ChatModelId {
  const trimmed = value?.trim();
  if (trimmed && trimmed in chatModelRegistry) {
    return trimmed as ChatModelId;
  }

  return fallback;
}
