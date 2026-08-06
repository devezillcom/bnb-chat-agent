import { z } from "zod";

import { createAgentFormSchema } from "@/lib/agents/schema";
import { deleteAgent } from "@/lib/agents/services/delete-agent";
import { getAgent } from "@/lib/agents/services/get-agent";
import { updateAgent } from "@/lib/agents/services/update-agent";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const getAgentRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: getAgentRouteParamsSchema,
  },
  (params, ctx) =>
    getAgent({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const PATCH = createApiHandler(
  {
    parameters: getAgentRouteParamsSchema,
    requestBody: createAgentFormSchema,
  },
  (params, ctx) =>
    updateAgent({
      name: params.name,
      description: params.description,
      systemPrompt: params.systemPrompt,
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: getAgentRouteParamsSchema,
  },
  (params, ctx) =>
    deleteAgent({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
