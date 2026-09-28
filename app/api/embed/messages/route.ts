import { NextRequest } from "next/server";
import { z } from "zod";

import { createChatAgentEventStreamResponse } from "@/lib/chat-agent/utils/create-chat-agent-stream-response";
import { EMBED_MESSAGE_MAX_LENGTH } from "@/lib/embed/constants";
import { streamWebsiteEmbedMessage } from "@/lib/embed/services/stream-website-embed-message";
import { embedErrorResponse } from "@/lib/embed/utils/embed-http";

const websiteEmbedMessageSchema = z.object({
  token: z.string().trim().min(1, { error: "Chat session is invalid." }),
  visitorId: z.uuid({ error: "Visitor is invalid." }),
  message: z
    .string()
    .trim()
    .min(1, { error: "Message is required." })
    .max(EMBED_MESSAGE_MAX_LENGTH, {
      error: `Message must be at most ${EMBED_MESSAGE_MAX_LENGTH} characters.`,
    }),
});

export async function POST(request: NextRequest) {
  try {
    const body = websiteEmbedMessageSchema.parse(
      await request.json().catch(() => null),
    );
    const events = await streamWebsiteEmbedMessage(body);

    return createChatAgentEventStreamResponse(events);
  } catch (error) {
    return embedErrorResponse(error);
  }
}
