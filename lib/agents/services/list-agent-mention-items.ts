import "server-only";

import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";
import { listAgentTools } from "@/lib/tools/services/list-agent-tools";

import type { AgentMentionItem } from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { buildAgentMentionItems } from "../utils/build-agent-mention-items";

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

  return buildAgentMentionItems(agentTools, agentSkills);
}
