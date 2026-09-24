import type { SkillFormValues } from "../schema";
import type { AgentSkillItem } from "../types";

export function createSkillFormDefaults(): SkillFormValues {
  return {
    name: "",
    description: "",
    instructions: "",
  };
}

export function agentSkillItemToFormValues(skill: AgentSkillItem): SkillFormValues {
  return {
    name: skill.name,
    description: skill.description ?? "",
    instructions: skill.instructions,
  };
}
