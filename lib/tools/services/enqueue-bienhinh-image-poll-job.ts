import { eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import type { ChatAgentRunContext } from "@/lib/chat-agent/schema";
import { db } from "@/lib/db";
import { addJob } from "@/lib/qstash/services/add-job-service";

import {
  BIENHINH_IMAGE_POLL_INTERVAL_SECONDS,
  BIENHINH_IMAGE_POLL_MAX_ATTEMPTS,
  BIENHINH_IMAGE_POLL_QSTASH_JOB_NAME,
} from "../constants";
import type { BienhinhImagePollQstashPayload } from "../schemas/bienhinh-image-poll-qstash-payload-schema";

async function resolveQstashUserId(
  runContext: ChatAgentRunContext,
): Promise<string | undefined> {
  if ("userId" in runContext && runContext.userId) {
    return runContext.userId;
  }

  if ("connectionId" in runContext) {
    const [row] = await db
      .select({ userId: connections.userId })
      .from(connections)
      .where(eq(connections.id, runContext.connectionId))
      .limit(1);

    return row?.userId;
  }

  return undefined;
}

export async function enqueueBienhinhImagePollJob(
  params: BienhinhImagePollQstashPayload & { delay?: number },
): Promise<void> {
  const userId = await resolveQstashUserId(params.runContext);

  if (!userId) {
    console.warn("[bienhinh-image-poll] Missing userId; skipping enqueue.", {
      requestId: params.requestId,
      sessionId: params.sessionId,
    });
    return;
  }

  const payload: BienhinhImagePollQstashPayload = {
    requestId: params.requestId,
    sessionId: params.sessionId,
    runContext: params.runContext,
    attempt: params.attempt,
    maxAttempts: params.maxAttempts ?? BIENHINH_IMAGE_POLL_MAX_ATTEMPTS,
  };

  await addJob({
    userId,
    jobName: BIENHINH_IMAGE_POLL_QSTASH_JOB_NAME,
    payload,
    delay: params.delay ?? BIENHINH_IMAGE_POLL_INTERVAL_SECONDS,
    flowControl: {
      key: `bienhinh-image-poll-${params.requestId}`,
      parallelism: 1,
    },
  });
}
