import { z } from "zod";

export const createAgentFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Agent name is required." }),
  description: z.string().trim().optional(),
  systemPrompt: z
    .string()
    .trim()
    .min(1, { error: "System prompt is required." }),
});

export type CreateAgentFormValues = z.infer<typeof createAgentFormSchema>;
