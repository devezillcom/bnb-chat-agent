import { z } from "zod";

import { CONNECTION_NAME_MAX_LENGTH } from "./constants";

export const connectionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Name is required." })
    .max(CONNECTION_NAME_MAX_LENGTH, {
      error: `Name must be at most ${CONNECTION_NAME_MAX_LENGTH} characters.`,
    }),
});

export const updateConnectionSchema = z.object({
  name: connectionFormSchema.shape.name.optional(),
  agentId: z.uuid({ error: "Agent is required." }).nullable().optional(),
});

export const completeFacebookConnectSchema = z.object({
  pageIds: z
    .array(z.string().trim().min(1))
    .min(1, { error: "Select at least one page." }),
});

export const refreshConnectionConnectQstashPayloadSchema = z.object({
  connectionId: z.uuid(),
});

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
export type UpdateConnectionValues = z.infer<typeof updateConnectionSchema>;
export type CompleteFacebookConnectValues = z.infer<
  typeof completeFacebookConnectSchema
>;
