import { z } from "zod";

export const skillFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Skill name is required." }),
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
