import { z } from "zod";

import { isKnownToolHandlerType } from "./tool-handler-registry";

export const toolHandlerKeySchema = z
  .string()
  .trim()
  .min(1, { error: "Handler key is required." })
  .regex(/^[a-z][a-z0-9_-]*$/, {
    error:
      "Use lowercase letters, numbers, hyphens, and underscores. Start with a letter.",
  });

export const createToolFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Tool name is required." }),
  handlerKey: toolHandlerKeySchema,
  handlerType: z
    .string()
    .trim()
    .min(1, { error: "Handler type is required." })
    .refine(isKnownToolHandlerType, { error: "Choose a supported handler type." }),
  description: z.string().trim().optional(),
  config: z.record(z.string(), z.string()),
});

export type CreateToolFormValues = z.infer<typeof createToolFormSchema>;

export const updateToolFormSchema = createToolFormSchema;

export type UpdateToolFormValues = z.infer<typeof updateToolFormSchema>;
