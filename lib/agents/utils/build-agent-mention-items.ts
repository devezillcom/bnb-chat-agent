import {
  buildChildToolMentionName,
  buildChildToolMentionSlug,
} from "@/lib/common/build-child-tool-mention-slug";
import { slugifyName } from "@/lib/common/slugify-name";
import type { AgentSkillItem } from "@/lib/skills/types";
import type { AgentToolItem } from "@/lib/tools/types";
import { listRegistryToolChildNames } from "@/lib/tools/utils/list-registry-tool-child-names";

import type { AgentMentionItem } from "../types";

export function buildToolMentionItems(tool: AgentToolItem): AgentMentionItem[] {
  const parentSlug = slugifyName(tool.name, "tool");
  const childNames = listRegistryToolChildNames(
    tool.registryToolId,
    tool.config,
  );

  if (childNames.length === 0) {
    return [{ id: tool.id, type: "tool", name: tool.name, slug: parentSlug }];
  }

  return childNames.map((childName) => ({
    id: `${tool.id}:${childName}`,
    type: "tool",
    name: buildChildToolMentionName(tool.name, childName),
    slug: buildChildToolMentionSlug(parentSlug, childName),
  }));
}

export function buildSkillMentionItem(skill: AgentSkillItem): AgentMentionItem {
  return {
    id: skill.id,
    type: "skill",
    name: skill.name,
    slug: slugifyName(skill.name, "skill"),
  };
}

export function buildAgentMentionItems(
  agentTools: AgentToolItem[],
  agentSkills: AgentSkillItem[],
): AgentMentionItem[] {
  return [
    ...agentTools.flatMap(buildToolMentionItems),
    ...agentSkills.map(buildSkillMentionItem),
  ];
}
