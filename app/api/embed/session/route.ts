import { NextRequest } from "next/server";
import { z } from "zod";

import { getWebsiteEmbedSession } from "@/lib/embed/services/get-website-embed-session";
import {
  embedErrorResponse,
  embedJson,
  embedPreflight,
  withEmbedCorsIfOrigin,
} from "@/lib/embed/utils/embed-http";
import { APIError } from "@/lib/exposers/api-error";

function readVisitorId(request: NextRequest) {
  const visitorId = request.nextUrl.searchParams.get("visitorId")?.trim();

  if (!visitorId) {
    return undefined;
  }

  return z.uuid({ error: "Visitor is invalid." }).parse(visitorId);
}

export function OPTIONS(request: NextRequest) {
  return embedPreflight(request);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

    if (!token) {
      throw new APIError("ERR_EMBED_TOKEN_INVALID", "Chat session is invalid.", 401);
    }

    return withEmbedCorsIfOrigin(
      embedJson(
        await getWebsiteEmbedSession({
          token,
          visitorId: readVisitorId(request),
        }),
      ),
      origin,
    );
  } catch (error) {
    return withEmbedCorsIfOrigin(embedErrorResponse(error), origin);
  }
}
