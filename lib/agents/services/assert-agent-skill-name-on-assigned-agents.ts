import "server-only";

import { eq } from "drizzle-orm";

import { agentSkills } from "@/db/schema";
import { db } from "@/lib/db";

import { assertAgentSkillNameAvailable } from "../utils/assert-agent-skill-name-available";

export type AssertAgentSkillNameOnAssignedAgentsParams = {
  skillId: string;
  name: string;
};

export async function assertAgentSkillNameOnAssignedAgents(
  params: AssertAgentSkillNameOnAssignedAgentsParams,
): Promise<string[]> {
  const assignments = await db
    .select({ agentId: agentSkills.agentId })
    .from(agentSkills)
    .where(eq(agentSkills.skillId, params.skillId));

  for (const { agentId } of assignments) {
    await assertAgentSkillNameAvailable({
      agentId,
      name: params.name,
      excludeSkillId: params.skillId,
    });
  }

  return assignments.map((row) => row.agentId);
}
