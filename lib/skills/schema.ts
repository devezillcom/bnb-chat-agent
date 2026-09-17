import { z } from "zod";

export const skillSlugSchema = z
  .string()
  .trim()
  .min(1, { error: "Slug is required." })
  .regex(/^[a-z][a-z0-9_]*$/, {
    error:
      "Use lowercase letters, numbers, and underscores. Start with a letter.",
  });

export const skillFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Skill name is required." }),
  slug: skillSlugSchema,
  description: z
    .string()
    .trim()
    .min(1, { error: "Use cases are required." }),
  instructions: z
    .string()
    .trim()
    .min(1, { error: "Instructions are required." }),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;
