import "server-only";

import { HumanMessage } from "@langchain/core/messages";

import { resolveImageSourceForVision } from "@/lib/r2/utils/resolve-image-source-for-vision";

import type { ChatAgentImageAttachment } from "../schema";

type MultimodalContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function buildChatAgentHumanMessage(
  message: string,
  images?: ChatAgentImageAttachment[],
): Promise<HumanMessage> {
  const trimmed = message.trim();
  const attachments = images ?? [];

  if (attachments.length === 0) {
    return new HumanMessage(trimmed);
  }

  const content: MultimodalContentPart[] = [];

  if (trimmed) {
    content.push({ type: "text", text: trimmed });
  }

  const visionUrls = await Promise.all(
    attachments.map((image) =>
      resolveImageSourceForVision({
        url: image.url,
        key: image.key,
        mimeType: image.mimeType,
      }),
    ),
  );

  for (const dataUrl of visionUrls) {
    content.push({
      type: "image_url",
      image_url: { url: dataUrl },
    });
  }

  return new HumanMessage({ content });
}
