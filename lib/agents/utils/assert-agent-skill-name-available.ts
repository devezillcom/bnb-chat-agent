import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { agentSkills, skills } from "@/db/schema";
import { slugifyName } from "@/lib/common/slugify-name";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

export type AssertAgentSkillNameAvailableParams = {
  agentId: string;
  name: string;
  excludeSkillId?: string;
};

export async function assertAgentSkillNameAvailable(
  params: AssertAgentSkillNameAvailableParams,
): Promise<void> {
  const trimmedName = params.name.trim();
  const slug = slugifyName(trimmedName, "skill");

  const conditions = [eq(agentSkills.agentId, params.agentId)];

  if (params.excludeSkillId) {
    conditions.push(ne(agentSkills.skillId, params.excludeSkillId));
  }

  const assignedSkills = await db
    .select({ name: skills.name })
    .from(agentSkills)
    .innerJoin(skills, eq(agentSkills.skillId, skills.id))
    .where(and(...conditions));

  for (const skill of assignedSkills) {
    if (slugifyName(skill.name, "skill") === slug) {
      throw new APIError(
        "ERR_AGENT_SKILL_NAME_TAKEN",
        `This assistant already has a skill named "${trimmedName}". Each skill needs a unique name.`,
        409,
      );
    }
  }
}
