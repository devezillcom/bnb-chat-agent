import { and, eq } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function assignAgentSkill(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  const [skill] = await db
    .select({ id: skills.id })
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

  await db
    .insert(agentSkills)
    .values({ agentId: params.agentId, skillId: skill.id })
    .onConflictDoNothing();

  return { message: "Skill added to agent." };
}
