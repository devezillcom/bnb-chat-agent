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

export const facebookMessengerInboundQstashPayloadSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal("message"),
      connectionId: z.uuid(),
      psid: z.string().min(1),
      mid: z.string().min(1),
      text: z.string().optional(),
      imageAttachments: z
        .array(
          z.object({
            type: z.string(),
            url: z.url(),
          }),
        )
        .max(5)
        .optional(),
      hasUnsupportedAttachments: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("postback_get_started"),
      connectionId: z.uuid(),
      psid: z.string().min(1),
      postbackPayload: z.string().min(1),
    }),
  ],
);

export type FacebookMessengerInboundQstashPayload = z.infer<
  typeof facebookMessengerInboundQstashPayloadSchema
>;

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
export type UpdateConnectionValues = z.infer<typeof updateConnectionSchema>;
export type CompleteFacebookConnectValues = z.infer<
  typeof completeFacebookConnectSchema
>;
