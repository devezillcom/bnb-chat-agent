import { APIError } from "@/lib/exposers/api-error";

import { EMBED_BOOTSTRAP_RATE_LIMIT, EMBED_TOKEN_TTL_SECONDS } from "../constants";
import type {
  BootstrapWebsiteEmbedParams,
  BootstrapWebsiteEmbedResult,
} from "../types";
import { createEmbedToken } from "../utils/embed-token";
import { assertEmbedRateLimit } from "./assert-embed-rate-limit";
import { createEmbedRtdbStreamAuth } from "./create-embed-rtdb-stream-auth";
import { lookupWebsiteEmbedByPublicKey } from "./resolve-website-embed-connection";

export async function bootstrapWebsiteEmbed(
  params: BootstrapWebsiteEmbedParams,
): Promise<BootstrapWebsiteEmbedResult> {
  await assertEmbedRateLimit({
    key: `embed:bootstrap:${params.clientKey}`,
    limit: EMBED_BOOTSTRAP_RATE_LIMIT,
  });

  const connection = await lookupWebsiteEmbedByPublicKey(params.publicKey);

  if (!connection || connection.allowedOrigin !== params.origin) {
    throw new APIError("ERR_EMBED_NOT_FOUND", "Chat not found.", 404);
  }

  if (!connection.hasAgent) {
    throw new APIError(
      "ERR_EMBED_AGENT_REQUIRED",
      "This chat has no agent yet.",
      409,
    );
  }

  await assertEmbedRateLimit({
    key: `embed:bootstrap:connection:${connection.connectionId}`,
    limit: EMBED_BOOTSTRAP_RATE_LIMIT,
  });

  const issuedAt = Date.now();
  const token = createEmbedToken(connection.connectionId, issuedAt);
  const rtdb = await createEmbedRtdbStreamAuth({
    connectionId: connection.connectionId,
    visitorId: params.visitorId,
  });

  return {
    token,
    expiresAt: new Date(issuedAt + EMBED_TOKEN_TTL_SECONDS * 1000).toISOString(),
    rtdb,
  };
}
