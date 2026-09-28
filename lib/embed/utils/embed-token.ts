import { createHmac, timingSafeEqual } from "crypto";

import { z } from "zod";

import { APIError } from "@/lib/exposers/api-error";
import { getEncryptionKey } from "@/lib/secret-data-store/utils/get-encryption-key";

import { EMBED_TOKEN_TTL_SECONDS } from "../constants";
import type { EmbedTokenPayload } from "../types";

const embedTokenPayloadSchema = z.object({
  connectionId: z.uuid(),
  exp: z.number(),
});

function signEmbedTokenBody(body: string) {
  return createHmac("sha256", getEncryptionKey()).update(body).digest("base64url");
}

export function createEmbedToken(connectionId: string, now = Date.now()) {
  const payload: EmbedTokenPayload = {
    connectionId,
    exp: Math.floor(now / 1000) + EMBED_TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${body}.${signEmbedTokenBody(body)}`;
}

export function verifyEmbedToken(token: string, now = Date.now()): EmbedTokenPayload {
  const [body, signature, extra] = token.split(".");

  if (!body || !signature || extra) {
    throw new APIError("ERR_EMBED_TOKEN_INVALID", "Chat session is invalid.", 401);
  }

  const expected = signEmbedTokenBody(body);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new APIError("ERR_EMBED_TOKEN_INVALID", "Chat session is invalid.", 401);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new APIError("ERR_EMBED_TOKEN_INVALID", "Chat session is invalid.", 401);
  }

  const payload = embedTokenPayloadSchema.safeParse(parsed);

  if (!payload.success) {
    throw new APIError("ERR_EMBED_TOKEN_INVALID", "Chat session is invalid.", 401);
  }

  if (payload.data.exp * 1000 <= now) {
    throw new APIError(
      "ERR_EMBED_TOKEN_EXPIRED",
      "Chat session expired. Reload the page.",
      401,
    );
  }

  return payload.data;
}
