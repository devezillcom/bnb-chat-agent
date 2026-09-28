import type { RunnableConfig } from "@langchain/core/runnables";
import { and, eq } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import type { ChatAgentMessage } from "@/lib/chat-agent/schema";
import { getChatAgent } from "@/lib/chat-agent/services/create-chat-agent";
import { resolveChatAgentContext } from "@/lib/chat-agent/services/resolve-chat-agent-context";
import { mapAgentStateMessagesToChatMessages } from "@/lib/chat-agent/utils/map-agent-state-messages";
import { db } from "@/lib/db";

import type {
  GetWebsiteEmbedSessionParams,
  GetWebsiteEmbedSessionResult,
  WebsiteEmbedConnection,
} from "../types";
import { verifyEmbedToken } from "../utils/embed-token";
import { resolveWebsiteEmbedConnectionById } from "./resolve-website-embed-connection";

const WEBSITE_CHAT_ENV = "web" as const;

type AgentWithState = {
  getState: (
    config: RunnableConfig,
  ) => Promise<{ values: { messages?: unknown[] } }>;
};

export async function getWebsiteEmbedSession(
  params: GetWebsiteEmbedSessionParams,
): Promise<GetWebsiteEmbedSessionResult> {
  const claims = verifyEmbedToken(params.token);
  const connection = await resolveWebsiteEmbedConnectionById(claims.connectionId);
  const sessionId = params.visitorId
    ? await findWebsiteEmbedSessionId(connection, params.visitorId)
    : null;
  const messages = sessionId
    ? await loadWebsiteEmbedSessionMessages(connection, sessionId)
    : [];

  return {
    agentName: connection.agentName,
    firstMessage: connection.firstMessage,
    sessionId,
    messages,
  };
}

async function findWebsiteEmbedSessionId(
  connection: WebsiteEmbedConnection,
  visitorId: string,
): Promise<string | null> {
  const [existing] = await db
    .select({
      id: chatAgentSessions.id,
      agentId: chatAgentSessions.agentId,
    })
    .from(chatAgentSessions)
    .where(
      and(
        eq(chatAgentSessions.connectionId, connection.connectionId),
        eq(chatAgentSessions.externalParticipantId, visitorId),
        eq(chatAgentSessions.chatEnv, WEBSITE_CHAT_ENV),
      ),
    )
    .limit(1);

  if (!existing || existing.agentId !== connection.agentId) {
    return null;
  }

  return existing.id;
}

async function loadWebsiteEmbedSessionMessages(
  connection: WebsiteEmbedConnection,
  sessionId: string,
): Promise<ChatAgentMessage[]> {
  const agentContext = await resolveChatAgentContext({
    agentId: connection.agentId,
    workspaceId: connection.workspaceId,
    chatEnv: WEBSITE_CHAT_ENV,
  });
  const agent = await getChatAgent(agentContext);
  const state = await (agent as AgentWithState).getState({
    configurable: { thread_id: sessionId },
  });

  return mapAgentStateMessagesToChatMessages(state.values.messages ?? []);
}
