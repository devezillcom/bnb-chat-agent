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

  const rows = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      description: skills.description,
      tools: skills.tools,
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

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    tools: row.tools ?? [],
    instructions: row.instructions,
  }));
}
