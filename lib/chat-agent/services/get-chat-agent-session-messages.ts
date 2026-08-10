import type { RunnableConfig } from "@langchain/core/runnables";
import { and, eq } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  GetChatAgentSessionMessagesParams,
  GetChatAgentSessionMessagesResult,
} from "../types";
import { mapAgentStateMessagesToChatMessages } from "../utils/map-agent-state-messages";
import { getChatAgent } from "./create-chat-agent";
import { resolveChatAgentContext } from "./resolve-chat-agent-context";

type AgentWithState = {
  getState: (
    config: RunnableConfig,
  ) => Promise<{ values: { messages?: unknown[] } }>;
};

export async function getChatAgentSessionMessages(
  params: GetChatAgentSessionMessagesParams,
): Promise<GetChatAgentSessionMessagesResult> {
  const [session] = await db
    .select({ id: chatAgentSessions.id })
    .from(chatAgentSessions)
    .where(
      and(
        eq(chatAgentSessions.id, params.sessionId),
        eq(chatAgentSessions.workspaceId, params.workspaceId),
        eq(chatAgentSessions.userId, params.userId),
        eq(chatAgentSessions.agentId, params.agentId),
      ),
    )
    .limit(1);

  if (!session) {
    throw new APIError("ERR_NOT_FOUND", "Chat session not found.", 404);
  }

  const agentContext = await resolveChatAgentContext({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
  });
  const agent = await getChatAgent(agentContext);
  const state = await (agent as AgentWithState).getState({
    configurable: { thread_id: params.sessionId },
  });

  const messages = mapAgentStateMessagesToChatMessages(
    state.values.messages ?? [],
  );

  return {
    sessionId: params.sessionId,
    messages,
  };
}
