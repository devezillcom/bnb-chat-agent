import { and, eq } from "drizzle-orm";

import { agents, connections } from "@/db/schema";
import type { ActiveChatEnv } from "@/lib/chat-agent/config/chat-env";
import { DEFAULT_AGENT_FIRST_MESSAGE } from "@/lib/chat-agent/constants";
import { getOrCreateChannelAgentSession } from "@/lib/chat-agent/services/upsert-agent-session";
import { replyToChannelMessage } from "@/lib/channel-agent/services/reply-to-channel-message";
import { splitFacebookMessageText } from "@/lib/connections/utils/split-facebook-message-text";
import { db } from "@/lib/db";

import type { FacebookMessengerInboundQstashPayload } from "../schema";
import { sendFacebookMessengerSenderAction } from "../utils/send-facebook-messenger-message";
import { withFacebookTypingHeartbeat } from "../utils/with-facebook-typing-heartbeat";
import { claimConnectionInboundDedup } from "./claim-connection-inbound-dedup";
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
      model: agents.model,
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
  return trimmed || DEFAULT_AGENT_FIRST_MESSAGE;
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
    const mids = payload.mids ?? [payload.mid];
    let anyClaimed = false;

    for (const externalMessageId of mids) {
      const claimed = await claimConnectionInboundDedup({
        connectionId: connection.id,
        externalMessageId,
      });

      if (claimed) {
        anyClaimed = true;
      }
    }

    if (!anyClaimed) {
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

  try {
    const replyText = await withFacebookTypingHeartbeat(
      {
        pageAccessToken,
        psid: payload.psid,
      },
      async () => {
        const title =
          payload.kind === "message"
            ? payload.text?.trim().slice(0, 120) ||
              (hasImageAttachments ? "Facebook image" : "Facebook message")
            : "Get Started";

        const chatEnv: ActiveChatEnv = "facebook_page";

        const { sessionId } = await getOrCreateChannelAgentSession({
          connectionId: connection.id,
          workspaceId: connection.workspaceId,
          agentId: connection.agentId,
          chatEnv,
          externalParticipantId: payload.psid,
          title,
        });

        const context = {
          workspaceId: connection.workspaceId,
          connectionId: connection.id,
          agentId: connection.agentId,
          chatEnv,
          channelType: connection.channelType,
          externalParticipantId: payload.psid,
        };

        if (payload.kind === "postback_get_started") {
          return resolveAgentFirstMessage(connection.firstMessage);
        }

        if (payload.kind === "message" && (hasText || hasImageAttachments)) {
          const images = hasImageAttachments
            ? await storeFacebookInboundImages({
                attachments: payload.imageAttachments ?? [],
                pageAccessToken,
                workspaceId: connection.workspaceId,
                connectionId: connection.id,
              })
            : [];

          if (!hasText && images.length === 0 && hasUnsupportedAttachments) {
            return FACEBOOK_UNSUPPORTED_ATTACHMENT_REPLY;
          }

          if (!hasText && images.length === 0) {
            return "I couldn't read the image. Please try sending it again or describe your question as text.";
          }

          const result = await replyToChannelMessage({
            sessionId,
            chatEnv,
            message: payload.text?.trim()
              ? payload.text.trim()
              : FACEBOOK_IMAGE_ONLY_USER_MESSAGE,
            images: images.length > 0 ? images : undefined,
            agent: {
              id: connection.agentId,
              systemPrompt: connection.systemPrompt,
              model: connection.model,
            },
            context,
          });
          return result.message;
        }

        return FACEBOOK_UNSUPPORTED_ATTACHMENT_REPLY;
      },
    );

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
