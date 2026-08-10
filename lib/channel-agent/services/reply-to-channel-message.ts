import "server-only";

import { resolveWorkspaceAgentRuntime } from "@/lib/chat-agent/utils/resolve-workspace-agent-runtime";
import { invokeAgentTurn } from "@/lib/chat-agent/services/invoke-agent-turn";

import type {
  ReplyToChannelMessageParams,
  ReplyToChannelMessageResult,
} from "../types";

export async function replyToChannelMessage(
  params: ReplyToChannelMessageParams,
): Promise<ReplyToChannelMessageResult> {
  const runtime = await resolveWorkspaceAgentRuntime({
    agentId: params.agent.id,
    workspaceId: params.context.workspaceId,
    systemPrompt: params.agent.systemPrompt,
    chatEnv: params.chatEnv,
  });

  const result = await invokeAgentTurn({
    sessionId: params.sessionId,
    message: params.message,
    images: params.images,
    agentContext: {
      agentId: params.agent.id,
      workspaceId: params.context.workspaceId,
      chatEnv: params.chatEnv,
      systemPrompt: runtime.systemPrompt,
      toolSlugs: runtime.toolSlugs,
      knowledgeBaseIds: runtime.knowledgeBaseIds,
      citationsEnabled: runtime.citationsEnabled,
    },
    runContext: params.context,
  });

  return {
    message: result.message,
  };
}
