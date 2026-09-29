import "server-only";

import { HumanMessage } from "@langchain/core/messages";

import {
  getChatModelDefinition,
  type ChatModelId,
} from "@/lib/langchain/models/registry";

import { wrapAttachedImage } from "./attached-image-tag";
import { downloadAttachments } from "./download-attachments";
import { withMessageCreatedAt } from "./message-created-at";

import type { ChatAgentImageAttachment } from "../schema";

type MultimodalContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function buildChatAgentHumanMessage(
  message: string,
  images: ChatAgentImageAttachment[] | undefined,
  workspaceId: string,
  model: ChatModelId,
): Promise<HumanMessage> {
  let trimmed = message.trim();
  const attachments = images ?? [];
  const additional_kwargs = withMessageCreatedAt(
    undefined,
    new Date().toISOString(),
  );

  if (attachments.length === 0) {
    return new HumanMessage({ content: trimmed, additional_kwargs });
  }

  const resolvedAttachments = await downloadAttachments({
    attachments,
    workspaceId,
  });
  const supportsVision = getChatModelDefinition(model).supportsVision;
  const content: MultimodalContentPart[] = [];

  for (const image of resolvedAttachments) {
    if (supportsVision) {
      content.push({
        type: "image_url",
        image_url: { url: image.url },
      });
    }
    trimmed += `\n\n${wrapAttachedImage(image.url)}`;
  }

  if (!supportsVision) {
    return new HumanMessage({ content: trimmed, additional_kwargs });
  }

  if (trimmed) {
    content.push({ type: "text", text: trimmed });
  }

  return new HumanMessage({ content, additional_kwargs });
}
