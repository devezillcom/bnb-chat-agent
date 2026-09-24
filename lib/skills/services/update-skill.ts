import "server-only";

import { and, eq } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { assertAgentSkillNameOnAssignedAgents } from "@/lib/agents/services/assert-agent-skill-name-on-assigned-agents";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateSkillParams, UpdateSkillResult } from "../types";

export async function updateSkill(
  params: UpdateSkillParams,
): Promise<UpdateSkillResult> {
  const trimmedName = params.name.trim();
  const description = params.description.trim();
  const instructions = params.instructions.trim();

  const [existing] = await db
    .select({ name: skills.name })
    .from(skills)
    .where(
      and(
        eq(skills.id, params.skillId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  if (trimmedName !== existing.name) {
    await assertAgentSkillNameOnAssignedAgents({
      skillId: params.skillId,
      name: trimmedName,
    });
  }

  const updated = await db
    .update(skills)
    .set({
      name: trimmedName,
      description,
      instructions,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(skills.id, params.skillId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: skills.id });

  if (updated.length === 0) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  const assignedAgents = await db
    .select({ agentId: agentSkills.agentId })
    .from(agentSkills)
    .where(eq(agentSkills.skillId, params.skillId));

  for (const { agentId } of assignedAgents) {
    invalidateChatAgentCache(agentId);
  }

  return { message: "Skill updated." };
}
