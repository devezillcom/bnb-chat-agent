import { sendNotification } from "@/lib/notification/services/send-notification-service";

import {
  AGENT_SESSION_NOTIFICATION_EVENT,
  getAgentSessionNotificationChannel,
  type AgentSessionNotificationPayload,
} from "../constants/agent-session-notification";

export async function publishAgentSessionAssistantMessage(params: {
  sessionId: string;
  message: string;
}): Promise<void> {
  const message = params.message.trim();
  if (!message) {
    return;
  }

  const payload: AgentSessionNotificationPayload = {
    role: "assistant",
    event: AGENT_SESSION_NOTIFICATION_EVENT.ASSISTANT_MESSAGE,
    sessionId: params.sessionId,
    message,
  };

  try {
    await sendNotification({
      channelName: getAgentSessionNotificationChannel(params.sessionId),
      payload,
    });
  } catch (error) {
    console.error("[publish-agent-session-assistant-message] failed", {
      sessionId: params.sessionId,
      error,
    });
  }
}
