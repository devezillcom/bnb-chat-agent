import { addJob } from "@/lib/qstash/services/add-job-service";

import { FACEBOOK_MESSENGER_INBOUND_QSTASH_JOB_NAME } from "../constants";
import type { FacebookMessengerInboundQstashPayload } from "../schema";

export async function enqueueFacebookMessengerInboundJob(params: {
  userId: string;
  payload: FacebookMessengerInboundQstashPayload;
}): Promise<void> {
  await addJob({
    userId: params.userId,
    jobName: FACEBOOK_MESSENGER_INBOUND_QSTASH_JOB_NAME,
    payload: params.payload,
    flowControl: {
      key: `facebook-messenger-${params.payload.connectionId}-${params.payload.psid}`,
      parallelism: 1,
    },
  });
}
