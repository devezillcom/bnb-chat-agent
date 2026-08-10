import { z } from "zod";

export const CHAT_ENV_VALUES = ["web", "facebook_page", "zalo"] as const;

export type ChatEnv = (typeof CHAT_ENV_VALUES)[number];

export type ActiveChatEnv = Exclude<ChatEnv, "zalo">;

export type ChatEnvDelivery = "stream" | "invoke";

export type ChatEnvReplyGuidelines = "none" | "channel";

export type ChatEnvDefinition = {
  label: string;
  enabled: boolean;
  citationsEnabled: boolean;
  replyGuidelines: ChatEnvReplyGuidelines;
  delivery: ChatEnvDelivery;
  systemPromptSuffix: string;
};

export const CHAT_ENV_REGISTRY: Record<ChatEnv, ChatEnvDefinition> = {
  web: {
    label: "Web",
    enabled: true,
    citationsEnabled: true,
    replyGuidelines: "none",
    delivery: "stream",
    systemPromptSuffix: [
      "# Web chat guidelines",
      "",
      "- Be concise and helpful unless the user asks for detail.",
      "- When the user attaches images, analyze them directly.",
      "- You can use available tools when they help answer the user.",
    ].join("\n"),
  },
  facebook_page: {
    label: "Facebook Page",
    enabled: true,
    citationsEnabled: false,
    replyGuidelines: "channel",
    delivery: "invoke",
    systemPromptSuffix: [
      "# Facebook Page reply guidelines",
      "",
      "- Keep replies short and conversational, suitable for Messenger.",
      "- Do not include source filenames, section names, or citation markers.",
      "- When the user attaches images, analyze them directly.",
      "- You can use available tools when they help answer the user.",
    ].join("\n"),
  },
  zalo: {
    label: "Zalo",
    enabled: false,
    citationsEnabled: false,
    replyGuidelines: "channel",
    delivery: "invoke",
    systemPromptSuffix: [
      "# Zalo reply guidelines",
      "",
      "- Keep replies short and conversational, suitable for Zalo chat.",
      "- Do not include source filenames, section names, or citation markers.",
      "- When the user attaches images, analyze them directly.",
      "- You can use available tools when they help answer the user.",
    ].join("\n"),
  },
};

export const ACTIVE_CHAT_ENV_VALUES = CHAT_ENV_VALUES.filter(
  (chatEnv) => CHAT_ENV_REGISTRY[chatEnv].enabled,
) as ActiveChatEnv[];

export const activeChatEnvSchema = z.enum(ACTIVE_CHAT_ENV_VALUES);

export function isActiveChatEnv(chatEnv: ChatEnv): chatEnv is ActiveChatEnv {
  return CHAT_ENV_REGISTRY[chatEnv].enabled;
}

export function resolveChatEnvRuntime(chatEnv: ChatEnv): ChatEnvDefinition {
  return CHAT_ENV_REGISTRY[chatEnv];
}

export function connectionChannelTypeToChatEnv(channelType: string): ChatEnv {
  switch (channelType) {
    case "facebook":
      return "facebook_page";
    case "zalo":
      return "zalo";
    default:
      return "facebook_page";
  }
}

export function getChatEnvUiOptions() {
  return CHAT_ENV_VALUES.map((chatEnv) => ({
    value: chatEnv,
    label: CHAT_ENV_REGISTRY[chatEnv].label,
    enabled: CHAT_ENV_REGISTRY[chatEnv].enabled,
  })).filter((option) => option.enabled);
}
