import { z } from "zod";

import { refreshConnectionConnect } from "@/lib/connections/services/refresh-connection-connect";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const refreshConnectionRouteParamsSchema = z.object({
  connectionId: z.uuid(),
});

export const POST = createApiHandler(
  {
    parameters: refreshConnectionRouteParamsSchema,
  },
  (params, ctx) =>
    refreshConnectionConnect({
      id: params.connectionId,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
