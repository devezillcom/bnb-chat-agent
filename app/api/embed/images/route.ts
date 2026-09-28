import { NextRequest } from "next/server";
import { z } from "zod";

import { createEmbedImageUploadUrl } from "@/lib/embed/services/create-embed-image-upload-url";
import {
  embedErrorResponse,
  embedJson,
  embedPreflight,
  withEmbedCorsIfOrigin,
} from "@/lib/embed/utils/embed-http";

const embedImageUploadSchema = z.object({
  token: z.string().trim().min(1, { error: "Chat session is invalid." }),
  visitorId: z.uuid({ error: "Visitor is invalid." }),
  contentType: z.string().trim().min(1, { error: "Content type is required." }),
  contentLength: z.int().positive({ error: "Image size is required." }),
});

export function OPTIONS(request: NextRequest) {
  return embedPreflight(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = embedImageUploadSchema.parse(await request.json().catch(() => null));
    const result = await createEmbedImageUploadUrl(body);

    return withEmbedCorsIfOrigin(embedJson(result), origin);
  } catch (error) {
    return withEmbedCorsIfOrigin(embedErrorResponse(error), origin);
  }
}
