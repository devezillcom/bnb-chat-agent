import type { ChatAgentMessage } from "../schema";
import { extractMessageContent } from "./extract-message-content";

type AgentStateMessage = {
  _getType?: () => string;
  type?: string;
  content?: unknown;
};

function getMessageType(message: AgentStateMessage): string {
  const type = message._getType?.() ?? message.type ?? "";
  return type.toLowerCase();
}

function isUserMessageType(type: string): boolean {
  return type === "human" || type === "humanmessage";
}

function isAssistantMessageType(type: string): boolean {
  return type === "ai" || type === "aimessage";
}

export function mapAgentStateMessagesToChatMessages(
  messages: unknown[],
): ChatAgentMessage[] {
  const result: ChatAgentMessage[] = [];

  for (const raw of messages) {
    const message = raw as AgentStateMessage;
    const type = getMessageType(message);
    const content = extractMessageContent(message.content).trim();
    if (!content) continue;

    if (isUserMessageType(type)) {
      result.push({ role: "user", content });
      continue;
    }

    if (isAssistantMessageType(type)) {
      result.push({ role: "assistant", content });
    }
  }

  return result;
}
