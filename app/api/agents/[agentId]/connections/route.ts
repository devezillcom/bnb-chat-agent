import { z } from "zod";

import { listConnectionsForAgent } from "@/lib/connections/services/list-connections-for-agent";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const listAgentConnectionsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: listAgentConnectionsRouteParamsSchema,
  },
  (params, ctx) =>
    listConnectionsForAgent({
      agentId: params.agentId,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
