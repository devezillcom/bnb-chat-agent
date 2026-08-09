import "server-only";

import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { db } from "@/lib/db";

import type { ListSkillsParams, ListSkillsResult } from "../types";

export async function listSkills(
  params: ListSkillsParams,
): Promise<ListSkillsResult> {
  const keyword = params.keyword?.trim();
  const sortKey = params.sortKey ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";

  const conditions = [eq(skills.workspaceId, params.workspaceId)];

  if (keyword) {
    conditions.push(
      or(
        ilike(skills.name, `%${keyword}%`),
        ilike(skills.description, `%${keyword}%`),
        ilike(skills.slug, `%${keyword}%`),
        ilike(skills.instructions, `%${keyword}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(skills)
    .where(whereClause);

  const orderBy =
    sortKey === "name"
      ? sortDirection === "asc"
        ? [asc(skills.name), asc(skills.id)]
        : [desc(skills.name), desc(skills.id)]
      : sortDirection === "asc"
        ? [asc(skills.createdAt), asc(skills.id)]
        : [desc(skills.createdAt), desc(skills.id)];

  const rows = await db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      description: skills.description,
      tools: skills.tools,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
      agentCount: sql<number>`coalesce(count(${agentSkills.agentId}), 0)::int`,
    })
    .from(skills)
    .leftJoin(agentSkills, eq(agentSkills.skillId, skills.id))
    .where(whereClause)
    .groupBy(skills.id)
    .orderBy(...orderBy)
    .limit(params.limit)
    .offset(params.offset);

  const nextOffset =
    params.offset + rows.length < total ? params.offset + rows.length : null;

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      tools: row.tools ?? [],
      agentCount: row.agentCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    nextOffset,
    total,
  };
}
