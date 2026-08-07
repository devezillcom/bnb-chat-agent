import type { QstashJobHandlerContext } from "@/lib/qstash/job-config";

import { facebookMessengerInboundQstashPayloadSchema } from "../schema";
import { processFacebookMessengerInbound } from "./process-facebook-messenger-inbound";

export async function handleFacebookMessengerInboundQstashJob(
  payload: unknown,
  _context: QstashJobHandlerContext,
): Promise<void> {
  const parsed = facebookMessengerInboundQstashPayloadSchema.parse(payload);

  try {
    await processFacebookMessengerInbound(parsed);
  } catch (error) {
    console.error("[facebook-messenger-inbound] Processing failed", {
      connectionId: parsed.connectionId,
      psid: parsed.psid,
      kind: parsed.kind,
      error,
    });
    throw error;
  }
}
