import { getRedisClient } from "@/lib/redis/utils/get-redis-client";

import { FACEBOOK_MESSENGER_PENDING_REDIS_TTL_SECONDS } from "../constants";
import {
  facebookMessengerPendingMessageSchema,
  type FacebookMessengerPendingMessage,
} from "../schema";
import {
  getFacebookMessengerPendingMessagesKey,
  getFacebookMessengerPendingMidsKey,
} from "../utils/facebook-messenger-pending-redis-keys";

export type AppendFacebookMessengerPendingMessageParams = {
  connectionId: string;
  psid: string;
  message: Omit<FacebookMessengerPendingMessage, "receivedAt">;
};

export type AppendFacebookMessengerPendingMessageResult = {
  appended: boolean;
};

export async function appendFacebookMessengerPendingMessage(
  params: AppendFacebookMessengerPendingMessageParams,
): Promise<AppendFacebookMessengerPendingMessageResult> {
  const redis = getRedisClient();
  const messagesKey = getFacebookMessengerPendingMessagesKey(
    params.connectionId,
    params.psid,
  );
  const midsKey = getFacebookMessengerPendingMidsKey(
    params.connectionId,
    params.psid,
  );

  const added = await redis.sadd(midsKey, params.message.mid);
  if (added === 0) {
    return { appended: false };
  }

  const pendingMessage: FacebookMessengerPendingMessage = {
    ...params.message,
    receivedAt: Date.now(),
  };

  await redis.rpush(messagesKey, pendingMessage);
  await redis.expire(messagesKey, FACEBOOK_MESSENGER_PENDING_REDIS_TTL_SECONDS);
  await redis.expire(midsKey, FACEBOOK_MESSENGER_PENDING_REDIS_TTL_SECONDS);

  return { appended: true };
}
