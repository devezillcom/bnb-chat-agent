import "server-only";

import { getAgent } from "@/lib/agents/services/get-agent";
import { resolveWorkspaceAgentRuntime } from "@/lib/chat-agent/utils/resolve-workspace-agent-runtime";

export type ResolveChatAgentContextParams = {
  agentId: string;
  workspaceId: string;
};

export type ResolveChatAgentContextResult = {
  agentId: string;
  workspaceId: string;
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
    citationsEnabled: true,
  });

  return {
    agentId: agent.id,
    workspaceId: params.workspaceId,
    systemPrompt: runtime.systemPrompt,
    toolSlugs: runtime.toolSlugs,
    knowledgeBaseIds: runtime.knowledgeBaseIds,
    citationsEnabled: runtime.citationsEnabled,
  };
}
