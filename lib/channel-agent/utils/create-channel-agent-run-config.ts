import type { RunnableConfig } from "@langchain/core/runnables";

import type { ChannelAgentContext } from "../schema";

export function createChannelAgentRunConfig(
  sessionId: string,
  context: ChannelAgentContext,
): RunnableConfig & { context: ChannelAgentContext } {
  return {
    configurable: { thread_id: sessionId },
    context,
    metadata: {
      session_id: sessionId,
      workspace_id: context.workspaceId,
      connection_id: context.connectionId,
      agent_id: context.agentId,
      channel_type: context.channelType,
      external_participant_id: context.externalParticipantId,
      feature: "channel-agent",
    },
    tags: ["channel-agent", context.channelType],
    runName: "channel-agent-turn",
  };
}
