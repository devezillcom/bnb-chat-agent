import type { RunnableConfig } from "@langchain/core/runnables";

import type { ChatAgentRunContext } from "../schema";

function isInAppContext(
  context: ChatAgentRunContext,
): context is Extract<ChatAgentRunContext, { userId: string }> {
  return "userId" in context;
}

export function createAgentRunConfig(
  sessionId: string,
  context: ChatAgentRunContext,
): RunnableConfig & { context: ChatAgentRunContext } {
  if (isInAppContext(context)) {
    return {
      configurable: { thread_id: sessionId },
      context,
      metadata: {
        session_id: sessionId,
        user_id: context.userId,
        workspace_id: context.workspaceId,
        agent_id: context.agentId,
        chat_env: context.chatEnv,
        feature: "chat-agent",
      },
      tags: ["chat-agent", context.chatEnv],
      runName: "chat-agent-turn",
    };
  }

  return {
    configurable: { thread_id: sessionId },
    context,
    metadata: {
      session_id: sessionId,
      workspace_id: context.workspaceId,
      agent_id: context.agentId,
      chat_env: context.chatEnv,
      connection_id: context.connectionId,
      channel_type: context.channelType,
      external_participant_id: context.externalParticipantId,
      feature: "channel-agent",
    },
    tags: ["channel-agent", context.chatEnv, context.channelType],
    runName: "channel-agent-turn",
  };
}

/** @deprecated Use createAgentRunConfig */
export const createChatAgentRunConfig = createAgentRunConfig;
