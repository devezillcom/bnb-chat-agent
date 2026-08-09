import { and, eq } from "drizzle-orm";

import { agentSkills } from "@/db/schema";
import { db } from "@/lib/db";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function removeAgentSkill(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  await db
    .delete(agentSkills)
    .where(
      and(
        eq(agentSkills.agentId, params.agentId),
        eq(agentSkills.skillId, params.capabilityId),
      ),
    );

  return { message: "Skill removed from agent." };
}
