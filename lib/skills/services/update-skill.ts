import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { skills } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateSkillParams, UpdateSkillResult } from "../types";
import { validateSkillToolSlugs } from "../utils/validate-skill-tool-slugs";

export async function updateSkill(
  params: UpdateSkillParams,
): Promise<UpdateSkillResult> {
  const [existing] = await db
    .select({ id: skills.id, slug: skills.slug })
    .from(skills)
    .where(
      and(
        eq(skills.id, params.skillId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  const trimmedName = params.name.trim();
  const slug = params.slug.trim();
  const instructions = params.instructions.trim();
  const toolSlugs = await validateSkillToolSlugs(params.workspaceId, params.tools);

  if (slug !== existing.slug) {
    const [duplicate] = await db
      .select({ id: skills.id })
      .from(skills)
      .where(
        and(
          eq(skills.workspaceId, params.workspaceId),
          eq(skills.slug, slug),
          ne(skills.id, params.skillId),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new APIError(
        "ERR_SKILL_SLUG_EXISTS",
        "A skill with this slug already exists in the workspace.",
        409,
      );
    }
  }

  const updated = await db
    .update(skills)
    .set({
      name: trimmedName,
      slug,
      description: params.description?.trim() || null,
      instructions,
      tools: toolSlugs,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(skills.id, params.skillId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: skills.id });

  if (updated.length === 0) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  return { message: "Skill updated." };
}
