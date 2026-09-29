import type {
  ChatAgentImageAttachment,
  ChatAgentMessage,
} from "../schema";
import { stripAttachedImageTags } from "./attached-image-tag";
import { extractMessageContent } from "./extract-message-content";
import { readMessageCreatedAt } from "./message-created-at";
import { stripSystemEventTags } from "./system-event-tag";

type AgentStateMessage = {
  _getType?: () => string;
  type?: string;
  content?: unknown;
  additional_kwargs?: {
    lc_source?: unknown;
    createdAt?: unknown;
  };
};

function isSummarizationMessage(message: AgentStateMessage): boolean {
  return message.additional_kwargs?.lc_source === "summarization";
}

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

function mergeImageAttachments(
  groups: Array<ChatAgentImageAttachment[] | undefined>,
): ChatAgentImageAttachment[] | undefined {
  const seen = new Set<string>();
  const images: ChatAgentImageAttachment[] = [];

  for (const group of groups) {
    for (const image of group ?? []) {
      if (seen.has(image.url)) continue;
      seen.add(image.url);
      images.push(image);
    }
  }

  return images.length > 0 ? images : undefined;
}

export function mapAgentStateMessagesToChatMessages(
  messages: unknown[],
): ChatAgentMessage[] {
  const result: ChatAgentMessage[] = [];

  for (const raw of messages) {
    const message = raw as AgentStateMessage;
    if (isSummarizationMessage(message)) continue;

    const type = getMessageType(message);
    const rawContent = extractMessageContent(message.content);
    const strippedImages = stripAttachedImageTags(rawContent);
    const content = stripSystemEventTags(strippedImages.content).trim();
    const images = isUserMessageType(type)
      ? mergeImageAttachments([
          strippedImages.images,
          extractImageAttachments(message.content),
        ])
      : undefined;
    if (!content && !images) continue;

    const createdAt = readMessageCreatedAt(message.additional_kwargs);

    if (isUserMessageType(type)) {
      result.push({
        role: "user",
        content,
        images,
        ...(createdAt ? { createdAt } : {}),
      });
      continue;
    }

    if (isAssistantMessageType(type)) {
      result.push({
        role: "assistant",
        content,
        ...(createdAt ? { createdAt } : {}),
      });
    }
  }

  return result;
}
