import { isRedisConfigured } from "@/lib/redis/utils/get-redis-client";

import type { FacebookMessengerInboundQstashPayload } from "../schema";
import { appendFacebookMessengerPendingMessage } from "./append-facebook-messenger-pending-message";
import { enqueueFacebookMessengerInboundJob } from "./enqueue-facebook-messenger-inbound-job";
import { rescheduleFacebookMessengerPendingFlush } from "./reschedule-facebook-messenger-pending-flush";

export type BufferFacebookMessengerInboundMessageParams = {
  userId: string;
  payload: Extract<FacebookMessengerInboundQstashPayload, { kind: "message" }>;
};

export async function bufferFacebookMessengerInboundMessage(
  params: BufferFacebookMessengerInboundMessageParams,
): Promise<void> {
  if (!isRedisConfigured()) {
    await enqueueFacebookMessengerInboundJob({
      userId: params.userId,
      payload: params.payload,
    });
    return;
  }

  const { appended } = await appendFacebookMessengerPendingMessage({
    connectionId: params.payload.connectionId,
    psid: params.payload.psid,
    message: {
      mid: params.payload.mid,
      text: params.payload.text,
      imageAttachments: params.payload.imageAttachments,
      hasUnsupportedAttachments: params.payload.hasUnsupportedAttachments,
    },
  });

  if (!appended) {
    return;
  }

  await rescheduleFacebookMessengerPendingFlush({
    userId: params.userId,
    connectionId: params.payload.connectionId,
    psid: params.payload.psid,
  });
}
