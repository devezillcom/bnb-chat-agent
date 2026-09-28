import { NextRequest } from "next/server";
import { z } from "zod";

import { CHAT_AGENT_IMAGE_MAX_COUNT } from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";
import { createChatAgentEventStreamResponse } from "@/lib/chat-agent/utils/create-chat-agent-stream-response";
import { EMBED_MESSAGE_MAX_LENGTH } from "@/lib/embed/constants";
import { streamWebsiteEmbedMessage } from "@/lib/embed/services/stream-website-embed-message";
import {
  embedErrorResponse,
  embedPreflight,
  withEmbedCorsIfOrigin,
} from "@/lib/embed/utils/embed-http";

const embedMessageImageSchema = z.object({
  url: z.url({ error: "Image URL is invalid." }),
  key: z.string().trim().min(1, { error: "Image is invalid." }),
  mimeType: z.string().trim().optional(),
  fileName: z.string().trim().max(200).optional(),
});

const websiteEmbedMessageSchema = z
  .object({
    token: z.string().trim().min(1, { error: "Chat session is invalid." }),
    visitorId: z.uuid({ error: "Visitor is invalid." }),
    message: z
      .string()
      .trim()
      .max(EMBED_MESSAGE_MAX_LENGTH, {
        error: `Message must be at most ${EMBED_MESSAGE_MAX_LENGTH} characters.`,
      })
      .default(""),
    images: z
      .array(embedMessageImageSchema)
      .max(CHAT_AGENT_IMAGE_MAX_COUNT, {
        error: `Attach at most ${CHAT_AGENT_IMAGE_MAX_COUNT} images.`,
      })
      .optional(),
  })
  .refine(
    (data) => data.message.length > 0 || (data.images?.length ?? 0) > 0,
    { error: "Message or at least one image is required." },
  );

export function OPTIONS(request: NextRequest) {
  return embedPreflight(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = websiteEmbedMessageSchema.parse(
      await request.json().catch(() => null),
    );
    const events = await streamWebsiteEmbedMessage(body);

    return withEmbedCorsIfOrigin(createChatAgentEventStreamResponse(events), origin);
  } catch (error) {
    return withEmbedCorsIfOrigin(embedErrorResponse(error), origin);
  }
}
