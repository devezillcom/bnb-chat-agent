import { z } from "zod";

import { updateConnectionSchema } from "@/lib/connections/schema";
import { deleteConnection } from "@/lib/connections/services/delete-connection";
import { getConnection } from "@/lib/connections/services/get-connection";
import { updateConnection } from "@/lib/connections/services/update-connection";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const connectionRouteParamsSchema = z.object({
  connectionId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: connectionRouteParamsSchema,
  },
  (params, ctx) =>
    getConnection({
      id: params.connectionId,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const PATCH = createApiHandler(
  {
    parameters: connectionRouteParamsSchema,
    requestBody: updateConnectionSchema,
  },
  (params, ctx) =>
    updateConnection({
      id: params.connectionId,
      workspaceId: ctx.workspaceId,
      ...(params.name !== undefined ? { name: params.name } : {}),
      ...(params.agentId !== undefined ? { agentId: params.agentId } : {}),
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: connectionRouteParamsSchema,
  },
  (params, ctx) =>
    deleteConnection({
      id: params.connectionId,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "owner",
  },
);
