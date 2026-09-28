import {
  agentSessionNotificationStreamUrl,
  getAgentSessionNotificationChannel,
} from "@/lib/chat-agent/constants/agent-session-notification";
import { readFirebaseDatabaseUrl } from "@/lib/firebase/read-firebase-database-url";

import type { EmbedRtdbStreamAuth } from "../types";
import { createEmbedFirebaseIdToken } from "../utils/create-embed-firebase-id-token";

export async function createEmbedSessionNotificationAuth(params: {
  connectionId: string;
  visitorId: string;
  sessionId: string;
}): Promise<EmbedRtdbStreamAuth | null> {
  const databaseUrl = readFirebaseDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  const sessionChannel = getAgentSessionNotificationChannel(params.sessionId);
  const token = await createEmbedFirebaseIdToken({
    visitorId: params.visitorId,
    claims: {
      connectionId: params.connectionId,
      visitorId: params.visitorId,
      sessionChannel,
    },
  });

  if (!token) {
    return null;
  }

  return {
    streamUrl: agentSessionNotificationStreamUrl({
      databaseUrl,
      sessionId: params.sessionId,
    }),
    authToken: token.idToken,
    expiresAt: token.expiresAt,
  };
}
