import "server-only";

import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";
import { listAgentTools } from "@/lib/tools/services/list-agent-tools";

import { getAgent } from "../services/get-agent";
import { buildSkillMentionItem } from "./build-agent-mention-items";
import {
  resolveSupportedAgentTools,
  type SupportedAgentTool,
} from "./resolve-supported-agent-tools";

export type AgentImproveSkill = {
  id: string;
  mention: string;
  description: string | null;
  instructions: string;
};

export type AgentImproveContext = {
  assistant: {
    name: string;
    description: string | null;
  };
  supportedTools: SupportedAgentTool[];
  skills: AgentImproveSkill[];
};

export async function loadAgentImproveContext(params: {
  workspaceId: string;
  agentId: string;
}): Promise<AgentImproveContext> {
  const [agent, agentTools, agentSkills] = await Promise.all([
    getAgent(params),
    listAgentTools(params),
    listAgentSkills(params),
  ]);

  return {
    assistant: {
      name: agent.name,
      description: agent.description?.trim() || null,
    },
    supportedTools: resolveSupportedAgentTools(agentTools),
    skills: agentSkills.map((skill) => ({
      id: skill.id,
      mention: `@${buildSkillMentionItem(skill).name}`,
      description: skill.description || null,
      instructions: skill.instructions.trim(),
    })),
  };
}

export function mentionsForSkills(
  context: AgentImproveContext,
  skills: AgentImproveSkill[],
) {
  const validMentions = [
    ...context.supportedTools.flatMap((tool) => tool.mentions),
    ...skills.map((skill) => skill.mention),
  ];

  return {
    validMentions,
    mentionNames: validMentions.map((mention) => mention.slice(1)),
  };
}
