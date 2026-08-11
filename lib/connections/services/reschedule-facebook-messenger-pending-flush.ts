import { addJob } from "@/lib/qstash/services/add-job-service";
import { getQstashClient } from "@/lib/qstash/utils/get-qstash-client";
import { isQstashMessageNotFoundError } from "@/lib/qstash/utils/is-qstash-message-not-found-error";
import { getRedisClient } from "@/lib/redis/utils/get-redis-client";

import {
  FACEBOOK_MESSENGER_INBOUND_FLUSH_QSTASH_JOB_NAME,
  FACEBOOK_MESSENGER_PENDING_DEBOUNCE_SECONDS,
  FACEBOOK_MESSENGER_PENDING_REDIS_TTL_SECONDS,
} from "../constants";
import { getFacebookMessengerPendingMetaKey } from "../utils/facebook-messenger-pending-redis-keys";

export type RescheduleFacebookMessengerPendingFlushParams = {
  userId: string;
  connectionId: string;
  psid: string;
};

export type RescheduleFacebookMessengerPendingFlushResult = {
  generation: number;
  flushMessageId: string;
};

export async function rescheduleFacebookMessengerPendingFlush(
  params: RescheduleFacebookMessengerPendingFlushParams,
): Promise<RescheduleFacebookMessengerPendingFlushResult> {
  const redis = getRedisClient();
  const metaKey = getFacebookMessengerPendingMetaKey(
    params.connectionId,
    params.psid,
  );

  const previousFlushMessageId = await redis.hget<string>(
    metaKey,
    "flushMessageId",
  );

  if (previousFlushMessageId) {
    try {
      await getQstashClient().messages.delete(previousFlushMessageId);
    } catch (error) {
      if (!isQstashMessageNotFoundError(error)) {
        console.warn("[facebook-messenger-pending] Failed to cancel flush job", {
          connectionId: params.connectionId,
          psid: params.psid,
          flushMessageId: previousFlushMessageId,
          error,
        });
      }
    }
  }

  const generation = await redis.hincrby(metaKey, "generation", 1);

  const { messageId } = await addJob({
    userId: params.userId,
    jobName: FACEBOOK_MESSENGER_INBOUND_FLUSH_QSTASH_JOB_NAME,
    payload: {
      kind: "flush",
      connectionId: params.connectionId,
      psid: params.psid,
      generation,
    },
    delay: FACEBOOK_MESSENGER_PENDING_DEBOUNCE_SECONDS,
    flowControl: {
      key: `facebook-messenger-${params.connectionId}-${params.psid}`,
      parallelism: 1,
    },
  });

  await redis.hset(metaKey, {
    flushMessageId: messageId,
    generation: String(generation),
  });
  await redis.expire(metaKey, FACEBOOK_MESSENGER_PENDING_REDIS_TTL_SECONDS);

  return {
    generation,
    flushMessageId: messageId,
  };
}
