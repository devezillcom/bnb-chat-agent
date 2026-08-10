import type {
  ChatAgentImageAttachment,
  ChatAgentMessage,
} from "../schema";
import { extractMessageContent } from "./extract-message-content";

type AgentStateMessage = {
  _getType?: () => string;
  type?: string;
  content?: unknown;
};

type ImageContentPart = {
  type?: string;
  image_url?: {
    url?: unknown;
  };
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

function extractImageAttachments(
  content: unknown,
): ChatAgentImageAttachment[] | undefined {
  if (!Array.isArray(content)) return undefined;

  const images = content.flatMap((part) => {
    const imagePart = part as ImageContentPart;
    const url = imagePart.image_url?.url;

    if (imagePart.type !== "image_url" || typeof url !== "string") {
      return [];
    }

    return [{ url }];
  });

  return images.length > 0 ? images : undefined;
}

export function mapAgentStateMessagesToChatMessages(
  messages: unknown[],
): ChatAgentMessage[] {
  const result: ChatAgentMessage[] = [];

  for (const raw of messages) {
    const message = raw as AgentStateMessage;
    const type = getMessageType(message);
    const content = extractMessageContent(message.content).trim();
    const images = extractImageAttachments(message.content);
    if (!content && !images) continue;

    if (isUserMessageType(type)) {
      result.push({ role: "user", content, images });
      continue;
    }

    if (isAssistantMessageType(type)) {
      result.push({ role: "assistant", content });
    }
  }

  return result;
}
