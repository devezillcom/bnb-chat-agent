import "server-only";

import { eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import type { ChatAgentRunContext } from "@/lib/chat-agent/schema";
import { sendFacebookInboundImageReply } from "@/lib/connections/services/send-facebook-inbound-image-reply";
import { sendFacebookInboundReply } from "@/lib/connections/services/send-facebook-inbound-reply";
import { resolveFacebookInboundPageAccessToken } from "@/lib/connections/services/resolve-facebook-inbound-page-access-token";
import { sendFacebookMessengerSenderAction } from "@/lib/connections/utils/send-facebook-messenger-message";
import { splitFacebookMessageText } from "@/lib/connections/utils/split-facebook-message-text";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notification/services/send-notification-service";
import {
  claimBienhinhImageDelivery,
  markBienhinhImageDeliveryFailed,
  markBienhinhImageDeliverySucceeded,
} from "@/lib/tools/services/claim-bienhinh-image-delivery";

import {
  AGENT_SESSION_NOTIFICATION_EVENT,
  getAgentSessionNotificationChannel,
  type AgentSessionNotificationPayload,
} from "../constants/agent-session-notification";
import { invokeAgentTurn } from "./invoke-agent-turn";
import { resolveChatAgentContext } from "./resolve-chat-agent-context";
import {
  buildBienhinhImageCompletedEventMessage,
  buildBienhinhImageFailedEventMessage,
} from "../utils/system-event-tag";

export type DeliverBienhinhImageResultParams = {
  requestId: string;
  sessionId: string;
  runContext: ChatAgentRunContext;
  outcome:
    | {
        kind: "completed";
        templateName: string;
        imageUrl: string;
      }
    | {
        kind: "failed";
        error: string;
      };
};

async function loadFacebookConnection(connectionId: string) {
  const [row] = await db
    .select({
      encryptedAuthData: connections.encryptedAuthData,
      metadata: connections.metadata,
    })
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1);

  return row ?? null;
}

function isChannelContext(
  runContext: ChatAgentRunContext,
): runContext is Extract<ChatAgentRunContext, { connectionId: string }> {
  return "connectionId" in runContext;
}

async function deliverWebNotification(params: {
  sessionId: string;
  payload: AgentSessionNotificationPayload;
}): Promise<void> {
  try {
    await sendNotification({
      channelName: getAgentSessionNotificationChannel(params.sessionId),
      payload: params.payload,
    });
  } catch (error) {
    console.error("[deliver-bienhinh-image-result] Web notification failed", {
      sessionId: params.sessionId,
      error,
    });
  }
}

async function deliverFacebookFollowUp(params: {
  runContext: Extract<ChatAgentRunContext, { connectionId: string }>;
  replyText: string;
  imageUrl?: string;
}): Promise<void> {
  const connection = await loadFacebookConnection(params.runContext.connectionId);

  if (!connection) {
    throw new Error("Facebook connection not found for image delivery.");
  }

  const pageAccessToken = await resolveFacebookInboundPageAccessToken({
    metadata: connection.metadata,
    encryptedAuthData: connection.encryptedAuthData,
  });

  const psid = params.runContext.externalParticipantId;

  await sendFacebookMessengerSenderAction({
    pageAccessToken,
    psid,
    action: "typing_on",
  });

  try {
    const chunks = splitFacebookMessageText(params.replyText);

    for (const chunk of chunks) {
      await sendFacebookInboundReply({
        pageAccessToken,
        psid,
        text: chunk,
      });
    }

    if (params.imageUrl) {
      await sendFacebookInboundImageReply({
        pageAccessToken,
        psid,
        imageUrl: params.imageUrl,
      });
    }
  } catch (error) {
    await sendFacebookMessengerSenderAction({
      pageAccessToken,
      psid,
      action: "typing_off",
    });
    throw error;
  }
}

export async function deliverBienhinhImageResult(
  params: DeliverBienhinhImageResultParams,
): Promise<void> {
  const claimed = await claimBienhinhImageDelivery(params.requestId);
  if (!claimed) {
    return;
  }

  try {
    const agentContext = await resolveChatAgentContext({
      agentId: params.runContext.agentId,
      workspaceId: params.runContext.workspaceId,
      chatEnv: params.runContext.chatEnv,
    });

    const eventMessage =
      params.outcome.kind === "completed"
        ? buildBienhinhImageCompletedEventMessage({
            templateName: params.outcome.templateName,
            imageUrl: params.outcome.imageUrl,
          })
        : buildBienhinhImageFailedEventMessage({
            error: params.outcome.error,
          });

    const result = await invokeAgentTurn({
      sessionId: params.sessionId,
      message: eventMessage,
      agentContext,
      runContext: params.runContext,
    });

    if (isChannelContext(params.runContext)) {
      await deliverFacebookFollowUp({
        runContext: params.runContext,
        replyText: result.message,
        imageUrl:
          params.outcome.kind === "completed"
            ? params.outcome.imageUrl
            : undefined,
      });
    } else {
      // In-app sandbox (any chatEnv) still runs in the web UI.
      const notificationPayload: AgentSessionNotificationPayload =
        params.outcome.kind === "completed"
          ? {
              event: AGENT_SESSION_NOTIFICATION_EVENT.BIENHINH_IMAGE_COMPLETED,
              sessionId: params.sessionId,
              message: result.message,
              imageUrl: params.outcome.imageUrl,
              templateName: params.outcome.templateName,
            }
          : {
              event: AGENT_SESSION_NOTIFICATION_EVENT.BIENHINH_IMAGE_FAILED,
              sessionId: params.sessionId,
              message: result.message,
              error: params.outcome.error,
            };

      await deliverWebNotification({
        sessionId: params.sessionId,
        payload: notificationPayload,
      });
    }

    await markBienhinhImageDeliverySucceeded(params.requestId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image result delivery failed.";

    await markBienhinhImageDeliveryFailed(params.requestId, message);
    throw error;
  }
}
