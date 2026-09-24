import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { db } from "@/lib/db";
import { assertAgentInWorkspace } from "@/lib/agents/utils/assert-agent-in-workspace";

import type {
  ListAgentSkillsParams,
  ListAgentSkillsResult,
} from "../types";

export async function listAgentSkills(
  params: ListAgentSkillsParams,
): Promise<ListAgentSkillsResult> {
  await assertAgentInWorkspace(params);

  return db
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      instructions: skills.instructions,
    })
    .from(agentSkills)
    .innerJoin(skills, eq(agentSkills.skillId, skills.id))
    .where(
      and(
        eq(agentSkills.agentId, params.agentId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .orderBy(asc(skills.name), asc(skills.id));
}
