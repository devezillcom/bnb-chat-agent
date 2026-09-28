import { z } from "zod";

import {
  CONNECTION_NAME_MAX_LENGTH,
  WEBSITE_ALLOWED_ORIGINS_MAX,
} from "./constants";
import { normalizeWebsiteOrigin } from "./utils/normalize-website-origin";

export const connectionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Name is required." })
    .max(CONNECTION_NAME_MAX_LENGTH, {
      error: `Name must be at most ${CONNECTION_NAME_MAX_LENGTH} characters.`,
    }),
});

const websiteOriginsFieldsSchema = z.object({
  allowAllOrigins: z.boolean(),
  allowedOrigins: z
    .array(z.string().max(2000))
    .max(WEBSITE_ALLOWED_ORIGINS_MAX, {
      error: `Add at most ${WEBSITE_ALLOWED_ORIGINS_MAX} website domains.`,
    }),
});

function refineWebsiteOrigins(
  value: { allowAllOrigins: boolean; allowedOrigins: string[] },
  ctx: {
    addIssue: (issue: {
      code: "custom";
      message: string;
      path: (string | number)[];
    }) => void;
  },
) {
  if (value.allowAllOrigins) {
    return;
  }

  const filled = value.allowedOrigins
    .map((item, index) => ({ item: item.trim(), index }))
    .filter((entry) => entry.item.length > 0);

  if (filled.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Add at least one website domain, or allow all websites.",
      path: ["allowedOrigins"],
    });
    return;
  }

  const seen = new Set<string>();

  for (const entry of filled) {
    try {
      const origin = normalizeWebsiteOrigin(entry.item);

      if (seen.has(origin)) {
        ctx.addIssue({
          code: "custom",
          message: "This domain is already in the list.",
          path: ["allowedOrigins", entry.index],
        });
        continue;
      }

      seen.add(origin);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Enter a valid website domain.",
        path: ["allowedOrigins", entry.index],
      });
    }
  }
}

export const websiteConnectionFormSchema = z
  .object({
    name: connectionFormSchema.shape.name,
    agentId: z.uuid({ error: "Select a chat agent." }),
  })
  .and(websiteOriginsFieldsSchema)
  .superRefine((value, ctx) => {
    refineWebsiteOrigins(value, ctx);
  });

export const updateConnectionSchema = z
  .object({
    name: connectionFormSchema.shape.name.optional(),
    agentId: z.uuid({ error: "Agent is required." }).nullable().optional(),
    allowAllOrigins: z.boolean().optional(),
    allowedOrigins: z
      .array(z.string().max(2000))
      .max(WEBSITE_ALLOWED_ORIGINS_MAX, {
        error: `Add at most ${WEBSITE_ALLOWED_ORIGINS_MAX} website domains.`,
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.allowAllOrigins === undefined &&
      value.allowedOrigins === undefined
    ) {
      return;
    }

    if (
      value.allowAllOrigins === undefined ||
      value.allowedOrigins === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Allowed websites are incomplete.",
        path: ["allowedOrigins"],
      });
      return;
    }

    refineWebsiteOrigins(
      {
        allowAllOrigins: value.allowAllOrigins,
        allowedOrigins: value.allowedOrigins,
      },
      ctx,
    );
  });

export const completeFacebookConnectSchema = z.object({
  pageIds: z
    .array(z.string().trim().min(1))
    .min(1, { error: "Select at least one page." }),
});

export const refreshConnectionConnectQstashPayloadSchema = z.object({
  connectionId: z.uuid(),
});

const facebookMessengerImageAttachmentSchema = z.object({
  type: z.string(),
  url: z.url(),
});

export const facebookMessengerPendingMessageSchema = z.object({
  mid: z.string().min(1),
  text: z.string().optional(),
  imageAttachments: z.array(facebookMessengerImageAttachmentSchema).optional(),
  hasUnsupportedAttachments: z.boolean().optional(),
  receivedAt: z.number(),
});

export const facebookMessengerInboundMessagePayloadSchema = z.object({
  kind: z.literal("message"),
  connectionId: z.uuid(),
  psid: z.string().min(1),
  mid: z.string().min(1),
  mids: z.array(z.string().min(1)).min(1).optional(),
  text: z.string().optional(),
  imageAttachments: z.array(facebookMessengerImageAttachmentSchema).max(5).optional(),
  hasUnsupportedAttachments: z.boolean().optional(),
});

export const facebookMessengerInboundQstashPayloadSchema = z.discriminatedUnion(
  "kind",
  [
    facebookMessengerInboundMessagePayloadSchema,
    z.object({
      kind: z.literal("postback_get_started"),
      connectionId: z.uuid(),
      psid: z.string().min(1),
      postbackPayload: z.string().min(1),
    }),
  ],
);

export const facebookMessengerInboundFlushQstashPayloadSchema = z.object({
  kind: z.literal("flush"),
  connectionId: z.uuid(),
  psid: z.string().min(1),
  generation: z.number().int().positive(),
});

export type FacebookMessengerPendingMessage = z.infer<
  typeof facebookMessengerPendingMessageSchema
>;

export type FacebookMessengerInboundQstashPayload = z.infer<
  typeof facebookMessengerInboundQstashPayloadSchema
>;

export type FacebookMessengerInboundFlushQstashPayload = z.infer<
  typeof facebookMessengerInboundFlushQstashPayloadSchema
>;

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
export type WebsiteConnectionFormValues = z.infer<
  typeof websiteConnectionFormSchema
>;
export type UpdateConnectionValues = z.infer<typeof updateConnectionSchema>;
export type CompleteFacebookConnectValues = z.infer<
  typeof completeFacebookConnectSchema
>;
