import "server-only";

import { and, eq } from "drizzle-orm";

import { skills } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { DeleteSkillParams, DeleteSkillResult } from "../types";

export async function deleteSkill(
  params: DeleteSkillParams,
): Promise<DeleteSkillResult> {
  const deleted = await db
    .delete(skills)
    .where(
      and(
        eq(skills.id, params.skillId),
        eq(skills.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: skills.id });

  if (deleted.length === 0) {
    throw new APIError("ERR_SKILL_NOT_FOUND", "Skill not found.", 404);
  }

  return { message: "Skill deleted." };
}
