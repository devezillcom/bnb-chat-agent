import "server-only";

import { HumanMessage } from "@langchain/core/messages";

import { wrapAttachedImage } from "./attached-image-tag";
import { downloadAttachments } from "./download-attachments";

import type { ChatAgentImageAttachment } from "../schema";

type MultimodalContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function buildChatAgentHumanMessage(
  message: string,
  images: ChatAgentImageAttachment[] | undefined,
  workspaceId: string,
): Promise<HumanMessage> {
  let trimmed = message.trim();
  const attachments = images ?? [];

  if (attachments.length === 0) {
    return new HumanMessage(trimmed);
  }

  const resolvedAttachments = await downloadAttachments({
    attachments,
    workspaceId,
  });
  const content: MultimodalContentPart[] = [];

  for (let index = 0; index < resolvedAttachments.length; index++) {
    const image = resolvedAttachments[index];
    content.push({
      type: "image_url",
      image_url: { url: image.url },
    });
    trimmed += `\n\n${wrapAttachedImage(attachments[index].url)}`;
  }

  if (trimmed) {
    content.push({ type: "text", text: trimmed });
  }

  return new HumanMessage({ content });
}
