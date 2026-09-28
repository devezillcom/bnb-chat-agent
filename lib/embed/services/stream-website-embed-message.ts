import { streamAgentTurnTokens } from "@/lib/chat-agent/services/stream-chat-with-agent";
import { resolveChatAgentContext } from "@/lib/chat-agent/services/resolve-chat-agent-context";
import { getOrCreateChannelAgentSession } from "@/lib/chat-agent/services/upsert-agent-session";
import type { ChatAgentStreamEvent } from "@/lib/chat-agent/types";
import { buildChatAgentSessionTitle } from "@/lib/chat-agent/utils/build-chat-agent-session-title";

import { EMBED_MESSAGE_RATE_LIMIT } from "../constants";
import type { StreamWebsiteEmbedMessageParams } from "../types";
import { verifyEmbedToken } from "../utils/embed-token";
import { assertEmbedRateLimit } from "./assert-embed-rate-limit";
import { resolveWebsiteEmbedConnectionById } from "./resolve-website-embed-connection";

const FALLBACK_MESSAGE = "I am not sure how to answer that yet.";

export async function streamWebsiteEmbedMessage(
  params: StreamWebsiteEmbedMessageParams,
): Promise<AsyncGenerator<ChatAgentStreamEvent>> {
  const claims = verifyEmbedToken(params.token);
  const connection = await resolveWebsiteEmbedConnectionById(claims.connectionId);

  await assertEmbedRateLimit({
    key: `embed:messages:${connection.connectionId}:${params.visitorId}`,
    limit: EMBED_MESSAGE_RATE_LIMIT,
  });

  const session = await getOrCreateChannelAgentSession({
    connectionId: connection.connectionId,
    workspaceId: connection.workspaceId,
    agentId: connection.agentId,
    chatEnv: "web",
    externalParticipantId: params.visitorId,
    title: buildChatAgentSessionTitle(params.message),
  });

  const agentContext = await resolveChatAgentContext({
    agentId: connection.agentId,
    workspaceId: connection.workspaceId,
    chatEnv: "web",
  });

  return streamEvents({
    sessionId: session.sessionId,
    message: params.message,
    visitorId: params.visitorId,
    connectionId: connection.connectionId,
    workspaceId: connection.workspaceId,
    agentId: connection.agentId,
    agentContext,
  });
}

async function* streamEvents(params: {
  sessionId: string;
  message: string;
  visitorId: string;
  connectionId: string;
  workspaceId: string;
  agentId: string;
  agentContext: Awaited<ReturnType<typeof resolveChatAgentContext>>;
}): AsyncGenerator<ChatAgentStreamEvent> {
  yield { type: "session", sessionId: params.sessionId };

  let fullMessage = "";

  for await (const token of streamAgentTurnTokens({
    message: params.message,
    workspaceId: params.workspaceId,
    sessionId: params.sessionId,
    agentContext: params.agentContext,
    runContext: {
      workspaceId: params.workspaceId,
      agentId: params.agentId,
      chatEnv: "web",
      connectionId: params.connectionId,
      channelType: "website",
      externalParticipantId: params.visitorId,
    },
  })) {
    fullMessage += token;
    yield { type: "token", content: token };
  }

  yield {
    type: "done",
    sessionId: params.sessionId,
    message: fullMessage.trim() || FALLBACK_MESSAGE,
  };
}
