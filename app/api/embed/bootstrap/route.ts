import { NextRequest } from "next/server";
import { z } from "zod";

import { bootstrapWebsiteEmbed } from "@/lib/embed/services/bootstrap-website-embed";
import {
  embedCorsHeaders,
  embedErrorResponse,
  embedJson,
  readEmbedClientKey,
  withEmbedCors,
} from "@/lib/embed/utils/embed-http";
import { APIError } from "@/lib/exposers/api-error";

const bootstrapWebsiteEmbedSchema = z.object({
  publicKey: z
    .string()
    .trim()
    .min(16, { error: "Chat key is invalid." })
    .max(128, { error: "Chat key is invalid." }),
});

function exposesEmbedError(error: unknown) {
  return !(error instanceof APIError && error.code === "ERR_EMBED_NOT_FOUND");
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return new Response(null, { status: 204 });
  }

  return new Response(null, {
    status: 204,
    headers: embedCorsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    if (!origin) {
      throw new APIError("ERR_EMBED_NOT_FOUND", "Chat not found.", 404);
    }

    const body = bootstrapWebsiteEmbedSchema.parse(
      await request.json().catch(() => null),
    );
    const result = await bootstrapWebsiteEmbed({
      publicKey: body.publicKey,
      origin,
      clientKey: readEmbedClientKey(request),
    });

    return withEmbedCors(embedJson(result), origin);
  } catch (error) {
    const response = embedErrorResponse(error);

    if (origin && exposesEmbedError(error)) {
      return withEmbedCors(response, origin);
    }

    return response;
  }
}
