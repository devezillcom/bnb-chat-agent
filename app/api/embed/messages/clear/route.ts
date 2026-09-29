import { NextRequest } from "next/server";
import { z } from "zod";

import { clearWebsiteEmbedMessages } from "@/lib/embed/services/clear-website-embed-messages";
import {
  embedErrorResponse,
  embedJson,
  embedPreflight,
  withEmbedCorsIfOrigin,
} from "@/lib/embed/utils/embed-http";

const clearWebsiteEmbedMessagesSchema = z.object({
  token: z.string().trim().min(1, { error: "Chat session is invalid." }),
  visitorId: z.uuid({ error: "Visitor is invalid." }),
});

export function OPTIONS(request: NextRequest) {
  return embedPreflight(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = clearWebsiteEmbedMessagesSchema.parse(
      await request.json().catch(() => null),
    );
    const result = await clearWebsiteEmbedMessages(body);

    return withEmbedCorsIfOrigin(embedJson(result), origin);
  } catch (error) {
    return withEmbedCorsIfOrigin(embedErrorResponse(error), origin);
  }
}
