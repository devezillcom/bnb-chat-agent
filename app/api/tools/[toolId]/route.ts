import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { createToolFormSchema } from "@/lib/tools/schema";
import { deleteTool } from "@/lib/tools/services/delete-tool";
import { getTool } from "@/lib/tools/services/get-tool";
import { updateTool } from "@/lib/tools/services/update-tool";

const toolRouteParamsSchema = z.object({
  toolId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: toolRouteParamsSchema,
  },
  (params, ctx) =>
    getTool({
      workspaceId: ctx.workspaceId,
      toolId: params.toolId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const PATCH = createApiHandler(
  {
    parameters: toolRouteParamsSchema,
    requestBody: createToolFormSchema,
  },
  (params, ctx) =>
    updateTool({
      name: params.name,
      toolKey: params.toolKey,
      registryToolId: params.registryToolId,
      description: params.description,
      config: params.config,
      workspaceId: ctx.workspaceId,
      toolId: params.toolId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: toolRouteParamsSchema,
  },
  (params, ctx) =>
    deleteTool({
      workspaceId: ctx.workspaceId,
      toolId: params.toolId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
