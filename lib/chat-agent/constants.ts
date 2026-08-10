export const DEFAULT_AGENT_FIRST_MESSAGE = "Hello! How can I help you today?";

export const CHAT_AGENT_SUMMARIZATION_TRIGGER_TOKENS = 6000;

export const CHAT_AGENT_SUMMARIZATION_KEEP_MESSAGES = 20;

export function buildChatAgentSystemPrompt(): string {
  return [
    "You are a helpful chat agent assistant for BNB Chat Agent.",
    "",
    "Guidelines:",
    "- Be concise and helpful unless the user asks for detail.",
    "- When the user attaches images, analyze them directly.",
    "- You can use available tools when they help answer the user.",
  ].join("\n");
}
