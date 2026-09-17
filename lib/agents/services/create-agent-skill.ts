import { agentSkills } from "@/db/schema";
import { db } from "@/lib/db";
import { createSkill } from "@/lib/skills/services/create-skill";

import type { CreateAgentSkillParams, CreateAgentSkillResult } from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function createAgentSkill(
  params: CreateAgentSkillParams,
): Promise<CreateAgentSkillResult> {
  await assertAgentInWorkspace(params);

  const { id } = await createSkill({
    workspaceId: params.workspaceId,
    name: params.name,
    slug: params.slug,
    description: params.description,
    instructions: params.instructions,
  });

  await db.insert(agentSkills).values({
    agentId: params.agentId,
    skillId: id,
  });

  return {
    id,
    message: "Skill added to assistant.",
  };
}
