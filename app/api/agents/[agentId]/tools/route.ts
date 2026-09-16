import { z } from "zod";

import { createAgentTool } from "@/lib/agents/services/create-agent-tool";
import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { createToolFormSchema } from "@/lib/tools/schema";
import { listAgentTools } from "@/lib/tools/services/list-agent-tools";

const agentToolsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: agentToolsRouteParamsSchema,
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

export const POST = createApiHandler(
  {
    parameters: agentToolsRouteParamsSchema,
    requestBody: createToolFormSchema,
  },
  (params, ctx) =>
    createAgentTool({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      name: params.name,
      slug: params.slug,
      registryToolId: params.registryToolId,
      description: params.description,
      config: params.config,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
