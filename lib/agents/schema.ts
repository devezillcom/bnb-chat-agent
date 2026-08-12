import { z } from "zod";

import { chatModelIdSchema } from "@/lib/langchain/models/registry";

export const createAgentFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Agent name is required." }),
  description: z.string().trim().optional(),
  systemPrompt: z
    .string()
    .trim()
    .min(1, { error: "System prompt is required." }),
  model: chatModelIdSchema,
  firstMessage: z.string().trim().optional(),
});

export type CreateAgentFormValues = z.infer<typeof createAgentFormSchema>;
