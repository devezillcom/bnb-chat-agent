import { z } from "zod";

export const AGENT_SESSION_NOTIFICATION_EVENT = {
  ASSISTANT_MESSAGE: "assistant_message",
  BIENHINH_IMAGE_COMPLETED: "bienhinh_image_completed",
  BIENHINH_IMAGE_FAILED: "bienhinh_image_failed",
} as const;

export type AgentSessionNotificationEvent =
  (typeof AGENT_SESSION_NOTIFICATION_EVENT)[keyof typeof AGENT_SESSION_NOTIFICATION_EVENT];

export const agentSessionNotificationPayloadSchema = z.object({
  role: z.literal("assistant"),
  event: z.enum([
    AGENT_SESSION_NOTIFICATION_EVENT.ASSISTANT_MESSAGE,
    AGENT_SESSION_NOTIFICATION_EVENT.BIENHINH_IMAGE_COMPLETED,
    AGENT_SESSION_NOTIFICATION_EVENT.BIENHINH_IMAGE_FAILED,
  ]),
  sessionId: z.uuid(),
  message: z.string().min(1),
  imageUrl: z.url().optional(),
  templateName: z.string().optional(),
  error: z.string().optional(),
});

export type AgentSessionNotificationPayload = z.infer<
  typeof agentSessionNotificationPayloadSchema
>;

export function getAgentSessionNotificationChannel(sessionId: string): string {
  return `agent-session-${sessionId}`;
}

export function getAgentSessionNotificationPath(sessionId: string): string {
  return `channel-notifications/${getAgentSessionNotificationChannel(sessionId)}`;
}

export function agentSessionNotificationStreamUrl(params: {
  databaseUrl: string;
  sessionId: string;
}): string {
  const base = params.databaseUrl.replace(/\/+$/, "");
  return `${base}/${getAgentSessionNotificationPath(params.sessionId)}.json`;
}
