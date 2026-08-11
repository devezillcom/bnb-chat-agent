import type { QstashJobHandlerContext } from "@/lib/qstash/job-config";
import { getRedisClient } from "@/lib/redis/utils/get-redis-client";

import { facebookMessengerInboundFlushQstashPayloadSchema } from "../schema";
import { getFacebookMessengerPendingMetaKey } from "../utils/facebook-messenger-pending-redis-keys";
import { mergeFacebookMessengerPendingMessages } from "../utils/merge-facebook-messenger-pending-messages";
import { drainFacebookMessengerPendingMessages } from "./drain-facebook-messenger-pending-messages";
import { processFacebookMessengerInbound } from "./process-facebook-messenger-inbound";

export async function handleFacebookMessengerInboundFlushQstashJob(
  payload: unknown,
  _context: QstashJobHandlerContext,
): Promise<void> {
  const parsed = facebookMessengerInboundFlushQstashPayloadSchema.parse(payload);
  const metaKey = getFacebookMessengerPendingMetaKey(
    parsed.connectionId,
    parsed.psid,
  );

  const currentGeneration = Number(
    (await getRedisClient().hget(metaKey, "generation")) ?? 0,
  );

  if (currentGeneration !== parsed.generation) {
    return;
  }

  const pendingMessages = await drainFacebookMessengerPendingMessages({
    connectionId: parsed.connectionId,
    psid: parsed.psid,
  });

  const mergedPayload = mergeFacebookMessengerPendingMessages({
    connectionId: parsed.connectionId,
    psid: parsed.psid,
    messages: pendingMessages,
  });

  if (!mergedPayload) {
    return;
  }

  try {
    await processFacebookMessengerInbound(mergedPayload);
  } catch (error) {
    console.error("[facebook-messenger-inbound-flush] Processing failed", {
      connectionId: parsed.connectionId,
      psid: parsed.psid,
      generation: parsed.generation,
      messageCount: pendingMessages.length,
      error,
    });
    throw error;
  }
}
