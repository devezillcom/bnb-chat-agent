export type ChatModelProvider = "openai" | "anthropic";

export const chatModelIds = [
  "gpt-4.1",
  "gpt-4o",
  "o3-mini",
  "claude-sonnet-4-6",
  "claude-opus-4-6",
] as const;

export type ChatModelId = (typeof chatModelIds)[number];

export const defaultChatModel: ChatModelId = "claude-sonnet-4-6";

export type ChatModelDefinition = {
  label: string;
  provider: ChatModelProvider;
  modelName: string;
  supportsTemperature: boolean;
  description: string;
};

export const chatModelRegistry: Record<ChatModelId, ChatModelDefinition> = {
  "gpt-4.1": {
    label: "GPT-4.1",
    provider: "openai",
    modelName: "gpt-4.1",
    supportsTemperature: true,
    description: "Balanced OpenAI production model.",
  },
  "gpt-4o": {
    label: "GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    supportsTemperature: true,
    description: "OpenAI multimodal model.",
  },
  "o3-mini": {
    label: "o3-mini",
    provider: "openai",
    modelName: "o3-mini",
    supportsTemperature: false,
    description: "Lightweight OpenAI reasoning model.",
  },
  "claude-sonnet-4-6": {
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    modelName: "claude-sonnet-4-6",
    supportsTemperature: true,
    description: "Anthropic balanced model for agents and chat.",
  },
  "claude-opus-4-6": {
    label: "Claude Opus 4.6",
    provider: "anthropic",
    modelName: "claude-opus-4-6",
    supportsTemperature: true,
    description: "Anthropic flagship model.",
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
