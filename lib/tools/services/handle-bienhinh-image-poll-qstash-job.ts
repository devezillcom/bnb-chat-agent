import "server-only";

import type { QstashJobHandlerContext } from "@/lib/qstash/job-config";

import { BIENHINH_IMAGE_POLL_INTERVAL_SECONDS } from "../constants";
import { bienhinhImagePollQstashPayloadSchema } from "../schemas/bienhinh-image-poll-qstash-payload-schema";
import { enqueueBienhinhImagePollJob } from "./enqueue-bienhinh-image-poll-job";
import { deliverBienhinhImageResult } from "@/lib/chat-agent/services/deliver-bienhinh-image-result";
import { fetchBienhinhImageRequest } from "../utils/bienhinh-image-api";

export async function handleBienhinhImagePollQstashJob(
  payload: unknown,
  _context: QstashJobHandlerContext,
): Promise<void> {
  const parsed = bienhinhImagePollQstashPayloadSchema.parse(payload);
  const pollResult = await fetchBienhinhImageRequest(parsed.requestId);

  if (pollResult.status === "pending") {
    if (parsed.attempt + 1 >= parsed.maxAttempts) {
      await deliverBienhinhImageResult({
        requestId: parsed.requestId,
        sessionId: parsed.sessionId,
        runContext: parsed.runContext,
        outcome: {
          kind: "failed",
          error: "Image generation timed out before completion.",
        },
      });
      return;
    }

    await enqueueBienhinhImagePollJob({
      ...parsed,
      attempt: parsed.attempt + 1,
      delay: BIENHINH_IMAGE_POLL_INTERVAL_SECONDS,
    });
    return;
  }

  if (pollResult.status === "completed") {
    if (!pollResult.templateName || !pollResult.imageUrl) {
      await deliverBienhinhImageResult({
        requestId: parsed.requestId,
        sessionId: parsed.sessionId,
        runContext: parsed.runContext,
        outcome: {
          kind: "failed",
          error: "Completed image response was missing template or image URL.",
        },
      });
      return;
    }

    await deliverBienhinhImageResult({
      requestId: parsed.requestId,
      sessionId: parsed.sessionId,
      runContext: parsed.runContext,
      outcome: {
        kind: "completed",
        templateName: pollResult.templateName,
        imageUrl: pollResult.imageUrl,
      },
    });
    return;
  }

  await deliverBienhinhImageResult({
    requestId: parsed.requestId,
    sessionId: parsed.sessionId,
    runContext: parsed.runContext,
    outcome: {
      kind: "failed",
      error: pollResult.error ?? "Image generation failed.",
    },
  });
}
