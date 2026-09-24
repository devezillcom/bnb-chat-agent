import "server-only";

import {
  buildChildToolMentionName,
  buildChildToolMentionSlug,
} from "@/lib/common/build-child-tool-mention-slug";
import { slugifyName } from "@/lib/common/slugify-name";
import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";
import { listAgentTools } from "@/lib/tools/services/list-agent-tools";
import { listRegistryToolChildNames } from "@/lib/tools/utils/list-registry-tool-child-names";

import type { AgentMentionItem } from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export type ListAgentMentionItemsParams = {
  agentId: string;
  workspaceId: string;
};

export async function listAgentMentionItems(
  params: ListAgentMentionItemsParams,
): Promise<AgentMentionItem[]> {
  await assertAgentInWorkspace(params);

  const [agentTools, agentSkills] = await Promise.all([
    listAgentTools(params),
    listAgentSkills(params),
  ]);

  const items: AgentMentionItem[] = [];

  for (const tool of agentTools) {
    const parentSlug = slugifyName(tool.name, "tool");
    const childNames = listRegistryToolChildNames(
      tool.registryToolId,
      tool.config,
    );

    if (childNames.length === 0) {
      items.push({
        id: tool.id,
        type: "tool",
        name: tool.name,
        slug: parentSlug,
      });
      continue;
    }

    for (const childName of childNames) {
      items.push({
        id: `${tool.id}:${childName}`,
        type: "tool",
        name: buildChildToolMentionName(tool.name, childName),
        slug: buildChildToolMentionSlug(parentSlug, childName),
      });
    }
  }

  for (const skill of agentSkills) {
    items.push({
      id: skill.id,
      type: "skill",
      name: skill.name,
      slug: slugifyName(skill.name, "skill"),
    });
  }

  return items;
}
