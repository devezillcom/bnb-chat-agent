import "server-only";

import { and, eq } from "drizzle-orm";

import { skills } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { CreateSkillParams, CreateSkillResult } from "../types";
import { validateSkillToolSlugs } from "../utils/validate-skill-tool-slugs";

export async function createSkill(
  params: CreateSkillParams,
): Promise<CreateSkillResult> {
  const trimmedName = params.name.trim();
  const slug = params.slug.trim();
  const instructions = params.instructions.trim();
  const toolSlugs = await validateSkillToolSlugs(params.workspaceId, params.tools);

  const [existing] = await db
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(
        eq(skills.workspaceId, params.workspaceId),
        eq(skills.slug, slug),
      ),
    )
    .limit(1);

  if (existing) {
    throw new APIError(
      "ERR_SKILL_SLUG_EXISTS",
      "A skill with this slug already exists in the workspace.",
      409,
    );
  }

  const [skill] = await db
    .insert(skills)
    .values({
      workspaceId: params.workspaceId,
      name: trimmedName,
      slug,
      description: params.description?.trim() || null,
      instructions,
      tools: toolSlugs,
    })
    .returning({ id: skills.id });

  if (!skill) {
    throw new Error("Failed to create skill.");
  }

  return {
    id: skill.id,
    message: "Skill created.",
  };
}
