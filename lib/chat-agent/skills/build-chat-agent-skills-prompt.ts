import { slugifyName } from "@/lib/common/slugify-name";

export type ChatAgentSkillPromptItem = {
  name: string;
  instructions: string;
};

/**
 * Each skill section is headed by its slug so `@Skill Name` mentions
 * (rewritten to `` `skill_slug` `` in the system prompt) line up with it.
 */
export function buildChatAgentSkillsPrompt(
  skills: ChatAgentSkillPromptItem[] = [],
): string {
  if (skills.length === 0) {
    return "";
  }

  const sections = skills.map((skill) => {
    const slug = slugifyName(skill.name, "skill");
    const heading =
      slug === skill.name ? slug : `${slug} (${skill.name})`;

    return `## ${heading}\n\n${skill.instructions.trim()}`;
  });

  return ["# Skills", ...sections].join("\n\n");
}
