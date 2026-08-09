import type { AgentSkillItem } from "@/lib/skills/types";

export function buildChatAgentSkillsPrompt(
  skills: AgentSkillItem[] = [],
): string {
  if (skills.length === 0) {
    return "";
  }

  const sections = skills.map(
    (skill) => `## ${skill.name}\n\n${skill.instructions.trim()}`,
  );

  return ["# Skills", ...sections].join("\n\n");
}
