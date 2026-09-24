import { agentSkills } from "@/db/schema";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";
import { db } from "@/lib/db";
import { createSkill } from "@/lib/skills/services/create-skill";

import type { CreateAgentSkillParams, CreateAgentSkillResult } from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { assertAgentSkillNameAvailable } from "../utils/assert-agent-skill-name-available";

export async function createAgentSkill(
  params: CreateAgentSkillParams,
): Promise<CreateAgentSkillResult> {
  await assertAgentInWorkspace(params);

  const trimmedName = params.name.trim();

  await assertAgentSkillNameAvailable({
    agentId: params.agentId,
    name: trimmedName,
  });

  const { id } = await createSkill({
    workspaceId: params.workspaceId,
    name: trimmedName,
    description: params.description,
    instructions: params.instructions,
  });

  await db.insert(agentSkills).values({
    agentId: params.agentId,
    skillId: id,
  });

  invalidateChatAgentCache(params.agentId);

  return {
    id,
    message: "Skill added to assistant.",
  };
}
