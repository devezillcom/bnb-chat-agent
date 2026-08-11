import type {
  FacebookIncomingMessage,
  FacebookMessagingEvent,
  FacebookPostback,
} from "../types";
import { getFacebookConnectionByPageId } from "./get-facebook-connection-by-page-id";
import { bufferFacebookMessengerInboundMessage } from "./buffer-facebook-messenger-inbound-message";
import { enqueueFacebookMessengerInboundJob } from "./enqueue-facebook-messenger-inbound-job";
import { resolveFacebookInboundPageAccessToken } from "./resolve-facebook-inbound-page-access-token";
import { sendFacebookMessengerSenderAction } from "../utils/send-facebook-messenger-message";
import { isFacebookGetStartedPostback } from "../utils/is-facebook-get-started-postback";

async function markFacebookParticipantSeen(params: {
  pageAccessToken: string;
  psid: string;
}): Promise<void> {
  await sendFacebookMessengerSenderAction({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    action: "mark_seen",
  });
}

export async function handleFacebookMessagingEvent(
  event: FacebookMessagingEvent,
): Promise<void> {
  const pageId = event.recipient.id;
  const psid = event.sender.id;
  const connection = await getFacebookConnectionByPageId(pageId);

  if (!connection) {
    console.warn(`[facebook-webhook] No connection found for page ${pageId}`);
    return;
  }

  let pageAccessToken: string | null = null;

  try {
    pageAccessToken = await resolveFacebookInboundPageAccessToken({
      metadata: connection.metadata,
      encryptedAuthData: connection.encryptedAuthData,
    });
  } catch (error) {
    console.error("[facebook-webhook] Failed to resolve page access token", {
      connectionId: connection.id,
      error,
    });
    return;
  }

  await markFacebookParticipantSeen({
    pageAccessToken,
    psid,
  });

  if (!connection.agentId) {
    return;
  }

  if (event.message) {
    await enqueueFacebookMessageEvent({
      connection,
      psid,
      message: event.message,
    });
    return;
  }

  if (event.postback && isFacebookGetStartedPostback(event.postback)) {
    await enqueueFacebookGetStartedPostback({
      connection,
      psid,
      postback: event.postback,
    });
  }
}

async function enqueueFacebookMessageEvent(params: {
  connection: NonNullable<Awaited<ReturnType<typeof getFacebookConnectionByPageId>>>;
  psid: string;
  message: FacebookIncomingMessage;
}): Promise<void> {
  const attachments = params.message.attachments ?? [];
  const imageAttachments = attachments
    .filter(
      (attachment) =>
        attachment.type === "image" && Boolean(attachment.payload.url),
    )
    .map((attachment) => ({
      type: attachment.type,
      url: attachment.payload.url!,
    }));
  const hasUnsupportedAttachments = attachments.some(
    (attachment) => attachment.type !== "image",
  );

  await bufferFacebookMessengerInboundMessage({
    userId: params.connection.userId,
    payload: {
      kind: "message",
      connectionId: params.connection.id,
      psid: params.psid,
      mid: params.message.mid,
      text: params.message.text,
      imageAttachments:
        imageAttachments.length > 0 ? imageAttachments : undefined,
      hasUnsupportedAttachments: hasUnsupportedAttachments || undefined,
    },
  });
}

async function enqueueFacebookGetStartedPostback(params: {
  connection: NonNullable<Awaited<ReturnType<typeof getFacebookConnectionByPageId>>>;
  psid: string;
  postback: FacebookPostback;
}): Promise<void> {
  await enqueueFacebookMessengerInboundJob({
    userId: params.connection.userId,
    payload: {
      kind: "postback_get_started",
      connectionId: params.connection.id,
      psid: params.psid,
      postbackPayload: params.postback.payload,
    },
  });
}
