import { z } from "zod";

import { isKnownToolRegistryId } from "./tool-registry-metadata";

export const createToolFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Tool name is required." }),
  registryToolId: z
    .string()
    .trim()
    .min(1, { error: "Registry tool is required." })
    .refine(isKnownToolRegistryId, {
      error: "Choose a supported registry tool.",
    }),
  description: z.string().trim().optional(),
  config: z.record(z.string(), z.unknown()),
});

export type CreateToolFormValues = z.infer<typeof createToolFormSchema>;

export const updateToolFormSchema = createToolFormSchema;

export type UpdateToolFormValues = z.infer<typeof updateToolFormSchema>;
