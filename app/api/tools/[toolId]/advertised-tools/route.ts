import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listMcpAdvertisedTools } from "@/lib/tools/services/list-mcp-advertised-tools";

const advertisedToolsRouteParamsSchema = z.object({
  toolId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: advertisedToolsRouteParamsSchema,
  },
  (params, ctx) =>
    listMcpAdvertisedTools({
      workspaceId: ctx.workspaceId,
      toolId: params.toolId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
