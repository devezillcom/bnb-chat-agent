import { z } from "zod";

import { assignAgentTool } from "@/lib/agents/services/assign-agent-tool";
import { removeAgentTool } from "@/lib/agents/services/remove-agent-tool";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const agentToolRouteParamsSchema = z.object({
  agentId: z.uuid(),
  toolId: z.uuid(),
});

export const POST = createApiHandler(
  {
    parameters: agentToolRouteParamsSchema,
  },
  (params, ctx) =>
    assignAgentTool({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      capabilityId: params.toolId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: agentToolRouteParamsSchema,
  },
  (params, ctx) =>
    removeAgentTool({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      capabilityId: params.toolId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
