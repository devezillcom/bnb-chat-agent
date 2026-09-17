import { and, eq } from "drizzle-orm";

import { agentSkills } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { deleteSkill } from "@/lib/skills/services/delete-skill";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function removeAgentSkill(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  const [assignment] = await db
    .select({ skillId: agentSkills.skillId })
    .from(agentSkills)
    .where(
      and(
        eq(agentSkills.agentId, params.agentId),
        eq(agentSkills.skillId, params.capabilityId),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new APIError(
      "ERR_AGENT_SKILL_NOT_FOUND",
      "Skill is not assigned to this assistant.",
      404,
    );
  }

  await db
    .delete(agentSkills)
    .where(
      and(
        eq(agentSkills.agentId, params.agentId),
        eq(agentSkills.skillId, params.capabilityId),
      ),
    );

  const remainingAssignments = await db
    .select({ skillId: agentSkills.skillId })
    .from(agentSkills)
    .where(eq(agentSkills.skillId, params.capabilityId))
    .limit(1);

  if (remainingAssignments.length === 0) {
    await deleteSkill({
      workspaceId: params.workspaceId,
      skillId: params.capabilityId,
    });
  }

  return { message: "Skill removed from assistant." };
}
