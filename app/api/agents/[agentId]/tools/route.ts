import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listAgentTools } from "@/lib/tools/services/list-agent-tools";

const listAgentToolsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: listAgentToolsRouteParamsSchema,
  },
  (params, ctx) =>
    listAgentTools({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
