import { and, eq } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { assertAgentSkillNameAvailable } from "../utils/assert-agent-skill-name-available";

export async function assignAgentSkill(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  const [skill] = await db
    .select({ id: skills.id, name: skills.name })
    .from(skills)
    .where(
      and(
        eq(skills.id, params.capabilityId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!skill) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  const [existingAssignment] = await db
    .select({ skillId: agentSkills.skillId })
    .from(agentSkills)
    .where(
      and(
        eq(agentSkills.agentId, params.agentId),
        eq(agentSkills.skillId, skill.id),
      ),
    )
    .limit(1);

  if (!existingAssignment) {
    await assertAgentSkillNameAvailable({
      agentId: params.agentId,
      name: skill.name,
    });
  }

  await db
    .insert(agentSkills)
    .values({ agentId: params.agentId, skillId: skill.id })
    .onConflictDoNothing();

  invalidateChatAgentCache(params.agentId);

  return { message: "Skill added to agent." };
}
