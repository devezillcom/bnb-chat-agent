import "server-only";

import { getAgent } from "@/lib/agents/services/get-agent";

import type { ActiveChatEnv } from "../config/chat-env";
import { resolveWorkspaceAgentRuntime } from "../utils/resolve-workspace-agent-runtime";

export type ResolveChatAgentContextParams = {
  agentId: string;
  workspaceId: string;
  chatEnv: ActiveChatEnv;
};

export type ResolveChatAgentContextResult = {
  agentId: string;
  workspaceId: string;
  chatEnv: ActiveChatEnv;
  systemPrompt: string;
  toolSlugs: string[];
  knowledgeBaseIds: string[];
  citationsEnabled: boolean;
};

export async function resolveChatAgentContext(
  params: ResolveChatAgentContextParams,
): Promise<ResolveChatAgentContextResult> {
  const agent = await getAgent({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
  });

  const runtime = await resolveWorkspaceAgentRuntime({
    agentId: agent.id,
    workspaceId: params.workspaceId,
    systemPrompt: agent.systemPrompt,
    chatEnv: params.chatEnv,
  });

  return {
    agentId: agent.id,
    workspaceId: params.workspaceId,
    chatEnv: params.chatEnv,
    systemPrompt: runtime.systemPrompt,
    toolSlugs: runtime.toolSlugs,
    knowledgeBaseIds: runtime.knowledgeBaseIds,
    citationsEnabled: runtime.citationsEnabled,
  };
}
