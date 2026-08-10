import "server-only";

import { listAgentToolSlugs } from "@/lib/agents/services/list-agent-tool-slugs";
import { listAgentKnowledgeBaseIds } from "@/lib/knowledge-base/services/list-agent-knowledge-base-ids";
import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";

import {
  resolveChatEnvRuntime,
  type ActiveChatEnv,
} from "../config/chat-env";
import { buildChatAgentKnowledgePrompt } from "../knowledge/build-chat-agent-knowledge-prompt";
import { buildChatAgentSkillsPrompt } from "../skills/build-chat-agent-skills";

export type ResolveWorkspaceAgentRuntimeParams = {
  agentId: string;
  workspaceId: string;
  systemPrompt: string;
  chatEnv: ActiveChatEnv;
  citationsEnabled?: boolean;
};

export type ResolveWorkspaceAgentRuntimeResult = {
  chatEnv: ActiveChatEnv;
  systemPrompt: string;
  toolSlugs: string[];
  knowledgeBaseIds: string[];
  citationsEnabled: boolean;
};

function uniqueToolSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
}

export async function resolveWorkspaceAgentRuntime(
  params: ResolveWorkspaceAgentRuntimeParams,
): Promise<ResolveWorkspaceAgentRuntimeResult> {
  const chatEnvRuntime = resolveChatEnvRuntime(params.chatEnv);
  const citationsEnabled =
    params.citationsEnabled ?? chatEnvRuntime.citationsEnabled;

  const [agentSkills, directToolSlugs, knowledgeBaseIds] = await Promise.all([
    listAgentSkills({
      agentId: params.agentId,
      workspaceId: params.workspaceId,
    }),
    listAgentToolSlugs({
      agentId: params.agentId,
      workspaceId: params.workspaceId,
    }),
    listAgentKnowledgeBaseIds({
      agentId: params.agentId,
      workspaceId: params.workspaceId,
    }),
  ]);

  const skillToolSlugs = agentSkills.flatMap((skill) => skill.tools);
  const toolSlugs = uniqueToolSlugs([...directToolSlugs, ...skillToolSlugs]);
  const skillsPrompt = buildChatAgentSkillsPrompt(agentSkills);
  const knowledgePrompt = buildChatAgentKnowledgePrompt({
    knowledgeBaseCount: knowledgeBaseIds.length,
    citationsEnabled,
  });
  const systemPrompt = [
    params.systemPrompt.trim(),
    chatEnvRuntime.systemPromptSuffix,
    skillsPrompt,
    knowledgePrompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    chatEnv: params.chatEnv,
    systemPrompt,
    toolSlugs,
    knowledgeBaseIds,
    citationsEnabled,
  };
}
