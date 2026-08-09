import "server-only";

import { listAgentToolSlugs } from "@/lib/agents/services/list-agent-tool-slugs";
import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";

import { buildChatAgentSkillsPrompt } from "../skills/build-chat-agent-skills";

export type ResolveWorkspaceAgentRuntimeParams = {
  agentId: string;
  workspaceId: string;
  systemPrompt: string;
};

export type ResolveWorkspaceAgentRuntimeResult = {
  systemPrompt: string;
  toolSlugs: string[];
};

function uniqueToolSlugs(slugs: string[]): string[] {
  return [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
}

export async function resolveWorkspaceAgentRuntime(
  params: ResolveWorkspaceAgentRuntimeParams,
): Promise<ResolveWorkspaceAgentRuntimeResult> {
  const [agentSkills, directToolSlugs] = await Promise.all([
    listAgentSkills({
      agentId: params.agentId,
      workspaceId: params.workspaceId,
    }),
    listAgentToolSlugs({
      agentId: params.agentId,
      workspaceId: params.workspaceId,
    }),
  ]);

  const skillToolSlugs = agentSkills.flatMap((skill) => skill.tools);
  const toolSlugs = uniqueToolSlugs([...directToolSlugs, ...skillToolSlugs]);
  const skillsPrompt = buildChatAgentSkillsPrompt(agentSkills);
  const systemPrompt = [params.systemPrompt.trim(), skillsPrompt]
    .filter(Boolean)
    .join("\n\n");

  return { systemPrompt, toolSlugs };
}
