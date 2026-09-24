import "server-only";

import { skills } from "@/db/schema";
import { db } from "@/lib/db";

import type { CreateSkillParams, CreateSkillResult } from "../types";

export async function createSkill(
  params: CreateSkillParams,
): Promise<CreateSkillResult> {
  const trimmedName = params.name.trim();
  const description = params.description.trim();
  const instructions = params.instructions.trim();

  const [skill] = await db
    .insert(skills)
    .values({
      workspaceId: params.workspaceId,
      name: trimmedName,
      description,
      instructions,
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
