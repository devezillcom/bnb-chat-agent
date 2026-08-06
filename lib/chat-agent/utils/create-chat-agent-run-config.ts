import type { RunnableConfig } from "@langchain/core/runnables";

import type { ChatAgentContext } from "../types";

export function createChatAgentRunConfig(
  sessionId: string,
  context: ChatAgentContext,
): RunnableConfig & { context: ChatAgentContext } {
  return {
    configurable: { thread_id: sessionId },
    context,
    metadata: {
      session_id: sessionId,
      user_id: context.userId,
      workspace_id: context.workspaceId,
      feature: "chat-agent",
    },
    tags: ["chat-agent"],
    runName: "chat-agent-turn",
  };
}
