import type { SkillFormValues } from "../schema";
import type { AgentSkillItem } from "../types";

export function createSkillFormDefaults(): SkillFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    instructions: "",
  };
}

export function agentSkillItemToFormValues(skill: AgentSkillItem): SkillFormValues {
  return {
    name: skill.name,
    slug: skill.slug,
    description: skill.description ?? "",
    instructions: skill.instructions,
  };
}
