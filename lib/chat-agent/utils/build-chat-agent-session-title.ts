const CHAT_AGENT_SESSION_TITLE_MAX_LENGTH = 80;

export function buildChatAgentSessionTitle(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return "New chat";

  if (normalized.length <= CHAT_AGENT_SESSION_TITLE_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, CHAT_AGENT_SESSION_TITLE_MAX_LENGTH - 3)}...`;
}
