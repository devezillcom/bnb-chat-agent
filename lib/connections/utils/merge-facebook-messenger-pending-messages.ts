import { CHAT_AGENT_IMAGE_MAX_COUNT } from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";

import type {
  FacebookMessengerInboundQstashPayload,
  FacebookMessengerPendingMessage,
} from "../schema";

type MergedFacebookMessengerInboundMessage = Extract<
  FacebookMessengerInboundQstashPayload,
  { kind: "message" }
>;

export function mergeFacebookMessengerPendingMessages(params: {
  connectionId: string;
  psid: string;
  messages: FacebookMessengerPendingMessage[];
}): MergedFacebookMessengerInboundMessage | null {
  if (params.messages.length === 0) {
    return null;
  }

  const sorted = [...params.messages].sort(
    (left, right) => left.receivedAt - right.receivedAt,
  );

  const textParts: string[] = [];
  const imageAttachments: NonNullable<
    MergedFacebookMessengerInboundMessage["imageAttachments"]
  > = [];
  let hasUnsupportedAttachments = false;

  for (const message of sorted) {
    const trimmedText = message.text?.trim();
    if (trimmedText) {
      textParts.push(trimmedText);
    }

    if (message.imageAttachments?.length) {
      imageAttachments.push(...message.imageAttachments);
    }

    if (message.hasUnsupportedAttachments) {
      hasUnsupportedAttachments = true;
    }
  }

  const mids = sorted.map((message) => message.mid);
  const limitedImages = imageAttachments.slice(0, CHAT_AGENT_IMAGE_MAX_COUNT);

  return {
    kind: "message",
    connectionId: params.connectionId,
    psid: params.psid,
    mid: mids[0]!,
    mids,
    text: textParts.length > 0 ? textParts.join("\n") : undefined,
    imageAttachments:
      limitedImages.length > 0 ? limitedImages : undefined,
    hasUnsupportedAttachments: hasUnsupportedAttachments || undefined,
  };
}
