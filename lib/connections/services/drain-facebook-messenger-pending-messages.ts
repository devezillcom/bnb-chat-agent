import { getRedisClient } from "@/lib/redis/utils/get-redis-client";

import {
  facebookMessengerPendingMessageSchema,
  type FacebookMessengerPendingMessage,
} from "../schema";
import {
  getFacebookMessengerPendingMessagesKey,
  getFacebookMessengerPendingMidsKey,
} from "../utils/facebook-messenger-pending-redis-keys";

const DRAIN_PENDING_MESSAGES_SCRIPT = `
local messages = redis.call("LRANGE", KEYS[1], 0, -1)
redis.call("DEL", KEYS[1])
redis.call("DEL", KEYS[2])
return messages
`;

export type DrainFacebookMessengerPendingMessagesParams = {
  connectionId: string;
  psid: string;
};

function deserializePendingMessage(
  rawMessage: unknown,
): FacebookMessengerPendingMessage {
  const value =
    typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;

  return facebookMessengerPendingMessageSchema.parse(value);
}

export async function drainFacebookMessengerPendingMessages(
  params: DrainFacebookMessengerPendingMessagesParams,
): Promise<FacebookMessengerPendingMessage[]> {
  const redis = getRedisClient();
  const messagesKey = getFacebookMessengerPendingMessagesKey(
    params.connectionId,
    params.psid,
  );
  const midsKey = getFacebookMessengerPendingMidsKey(
    params.connectionId,
    params.psid,
  );

  const drainScript = redis.createScript<unknown[]>(DRAIN_PENDING_MESSAGES_SCRIPT);
  const rawMessages = await drainScript.eval([messagesKey, midsKey], []);

  if (!rawMessages?.length) {
    return [];
  }

  return rawMessages.map(deserializePendingMessage);
}
