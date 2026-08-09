import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { GetSkillParams, GetSkillResult } from "../types";

export async function getSkill(params: GetSkillParams): Promise<GetSkillResult> {
  const [skill] = await db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      description: skills.description,
      tools: skills.tools,
      instructions: skills.instructions,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
      agentCount: sql<number>`coalesce(count(${agentSkills.agentId}), 0)::int`,
    })
    .from(skills)
    .leftJoin(agentSkills, eq(agentSkills.skillId, skills.id))
    .where(
      and(eq(skills.id, params.skillId), eq(skills.workspaceId, params.workspaceId)),
    )
    .groupBy(skills.id)
    .limit(1);

  if (!skill) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  return {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
    tools: skill.tools ?? [],
    instructions: skill.instructions,
    agentCount: skill.agentCount,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
  };
}
