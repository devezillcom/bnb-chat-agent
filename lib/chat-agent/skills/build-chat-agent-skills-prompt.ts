import { slugifyName } from "@/lib/common/slugify-name";

export type ChatAgentSkillPromptItem = {
  name: string;
  description?: string | null;
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
    const description = skill.description?.trim();

    return [
      `## ${heading}`,
      description ? `**When to use:** ${description}` : "",
      skill.instructions.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
  });

  return [
    "# Skills",
    "Use each skill's **When to use** line, when present, to decide whether it applies to the current request. Always apply a skill that is referenced explicitly.",
    ...sections,
  ].join("\n\n");
}
