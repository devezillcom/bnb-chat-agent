import { z } from "zod";

import { isKnownToolRegistryId } from "./tool-registry";

export const slugSchema = z
  .string()
  .trim()
  .min(1, { error: "Slug is required." })
  .regex(/^[a-z][a-z0-9_]*$/, {
    error:
      "Use lowercase letters, numbers, and underscores. Start with a letter.",
  });

export const createToolFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Tool name is required." }),
  slug: slugSchema,
  registryToolId: z
    .string()
    .trim()
    .min(1, { error: "Registry tool is required." })
    .refine(isKnownToolRegistryId, {
      error: "Choose a supported registry tool.",
    }),
  description: z.string().trim().optional(),
  config: z.record(z.string(), z.string()),
});

export type CreateToolFormValues = z.infer<typeof createToolFormSchema>;

export const updateToolFormSchema = createToolFormSchema;

export type UpdateToolFormValues = z.infer<typeof updateToolFormSchema>;
