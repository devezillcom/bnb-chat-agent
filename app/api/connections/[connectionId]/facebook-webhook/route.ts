import { z } from "zod";

import { getFacebookConnectionWebhookStatus } from "@/lib/connections/services/get-facebook-connection-webhook-status";
import { subscribeFacebookConnectionWebhook } from "@/lib/connections/services/subscribe-facebook-connection-webhook";
import { unsubscribeFacebookConnectionWebhook } from "@/lib/connections/services/unsubscribe-facebook-connection-webhook";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const facebookWebhookRouteParamsSchema = z.object({
  connectionId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: facebookWebhookRouteParamsSchema,
  },
  (params, ctx) =>
    getFacebookConnectionWebhookStatus({
      connectionId: params.connectionId,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const POST = createApiHandler(
  {
    parameters: facebookWebhookRouteParamsSchema,
  },
  (params, ctx) =>
    subscribeFacebookConnectionWebhook({
      connectionId: params.connectionId,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: facebookWebhookRouteParamsSchema,
  },
  (params, ctx) =>
    unsubscribeFacebookConnectionWebhook({
      connectionId: params.connectionId,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
