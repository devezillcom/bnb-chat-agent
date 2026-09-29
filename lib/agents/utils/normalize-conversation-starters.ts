import {
  AGENT_CONVERSATION_STARTER_MAX_COUNT,
  AGENT_CONVERSATION_STARTER_MAX_LENGTH,
} from "../constants";

export function normalizeConversationStarters(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const starters: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const text = item.trim().slice(0, AGENT_CONVERSATION_STARTER_MAX_LENGTH);

    if (!text) {
      continue;
    }

    starters.push(text);

    if (starters.length >= AGENT_CONVERSATION_STARTER_MAX_COUNT) {
      break;
    }
  }

  return starters;
}
