import { and, eq } from "drizzle-orm";

import { agents, connections } from "@/db/schema";
import { DEFAULT_CHANNEL_AGENT_FIRST_MESSAGE } from "@/lib/channel-agent/constants";
import { replyToChannelMessage } from "@/lib/channel-agent/services/reply-to-channel-message";
import { splitFacebookMessageText } from "@/lib/channel-agent/utils/split-facebook-message-text";
import { db } from "@/lib/db";

import type { FacebookMessengerInboundQstashPayload } from "../schema";
import { sendFacebookMessengerSenderAction } from "../utils/send-facebook-messenger-message";
import { claimConnectionInboundDedup } from "./claim-connection-inbound-dedup";
import { getOrCreateConnectionConversation } from "./get-or-create-connection-conversation";
import { resolveFacebookInboundPageAccessToken } from "./resolve-facebook-inbound-page-access-token";
import { sendFacebookInboundReply } from "./send-facebook-inbound-reply";
import { storeFacebookInboundImages } from "./store-facebook-inbound-images";

const FACEBOOK_IMAGE_ONLY_USER_MESSAGE = "The customer sent this image.";
const FACEBOOK_UNSUPPORTED_ATTACHMENT_REPLY =
  "Thanks for your message. I can read text and image messages right now — please send your question that way.";

async function loadConnectionWithAgent(connectionId: string) {
  const [row] = await db
    .select({
      id: connections.id,
      workspaceId: connections.workspaceId,
      userId: connections.userId,
      agentId: connections.agentId,
      channelType: connections.channelType,
      encryptedAuthData: connections.encryptedAuthData,
      metadata: connections.metadata,
      agentName: agents.name,
      systemPrompt: agents.systemPrompt,
      firstMessage: agents.firstMessage,
    })
    .from(connections)
    .innerJoin(agents, eq(connections.agentId, agents.id))
    .where(eq(connections.id, connectionId))
    .limit(1);

  return row ?? null;
}

function resolveAgentFirstMessage(firstMessage: string | null): string {
  const trimmed = firstMessage?.trim();
  return trimmed || DEFAULT_CHANNEL_AGENT_FIRST_MESSAGE;
}

async function sendFacebookTypingIndicator(params: {
  pageAccessToken: string;
  psid: string;
  action: "typing_on" | "typing_off";
}): Promise<void> {
  await sendFacebookMessengerSenderAction({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    action: params.action,
  });
}

export async function processFacebookMessengerInbound(
  payload: FacebookMessengerInboundQstashPayload,
): Promise<void> {
  const connection = await loadConnectionWithAgent(payload.connectionId);

  if (!connection || connection.channelType !== "facebook" || !connection.agentId) {
    return;
  }

  const pageAccessToken = await resolveFacebookInboundPageAccessToken({
    metadata: connection.metadata,
    encryptedAuthData: connection.encryptedAuthData,
  });

  if (payload.kind === "message") {
    const claimed = await claimConnectionInboundDedup({
      connectionId: connection.id,
      externalMessageId: payload.mid,
    });

    if (!claimed) {
      return;
    }
  }

  const hasText =
    payload.kind === "message" && Boolean(payload.text?.trim());
  const hasImageAttachments =
    payload.kind === "message" && Boolean(payload.imageAttachments?.length);
  const hasUnsupportedAttachments =
    payload.kind === "message" && Boolean(payload.hasUnsupportedAttachments);

  const willReply =
    payload.kind === "postback_get_started" ||
    hasText ||
    hasImageAttachments ||
    hasUnsupportedAttachments;

  if (!willReply) {
    return;
  }

  await sendFacebookTypingIndicator({
    pageAccessToken,
    psid: payload.psid,
    action: "typing_on",
  });

  try {
    const title =
      payload.kind === "message"
        ? payload.text?.trim().slice(0, 120) ||
          (hasImageAttachments ? "Facebook image" : "Facebook message")
        : "Get Started";

    const { sessionId } = await getOrCreateConnectionConversation({
      connectionId: connection.id,
      workspaceId: connection.workspaceId,
      agentId: connection.agentId,
      externalParticipantId: payload.psid,
      title,
    });

    const context = {
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
      agentId: connection.agentId,
      channelType: connection.channelType,
      externalParticipantId: payload.psid,
    };

    let replyText: string;

    if (payload.kind === "postback_get_started") {
      replyText = resolveAgentFirstMessage(connection.firstMessage);
    } else if (payload.kind === "message" && (hasText || hasImageAttachments)) {
      const images = hasImageAttachments
        ? await storeFacebookInboundImages({
            attachments: payload.imageAttachments ?? [],
            pageAccessToken,
            workspaceId: connection.workspaceId,
            connectionId: connection.id,
          })
        : [];

      if (!hasText && images.length === 0 && hasUnsupportedAttachments) {
        replyText = FACEBOOK_UNSUPPORTED_ATTACHMENT_REPLY;
      } else if (!hasText && images.length === 0) {
        replyText =
          "I couldn't read the image. Please try sending it again or describe your question as text.";
      } else {
        const result = await replyToChannelMessage({
          sessionId,
          message: payload.text?.trim()
            ? payload.text.trim()
            : FACEBOOK_IMAGE_ONLY_USER_MESSAGE,
          images: images.length > 0 ? images : undefined,
          agent: {
            id: connection.agentId,
            systemPrompt: connection.systemPrompt,
          },
          context,
        });
        replyText = result.message;
      }
    } else {
      replyText = FACEBOOK_UNSUPPORTED_ATTACHMENT_REPLY;
    }

    const chunks = splitFacebookMessageText(replyText);

    for (const chunk of chunks) {
      await sendFacebookInboundReply({
        pageAccessToken,
        psid: payload.psid,
        text: chunk,
      });
    }
  } catch (error) {
    await sendFacebookTypingIndicator({
      pageAccessToken,
      psid: payload.psid,
      action: "typing_off",
    });
    throw error;
  }
}
