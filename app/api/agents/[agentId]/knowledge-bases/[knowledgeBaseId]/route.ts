import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { assignAgentKnowledgeBase } from "@/lib/knowledge-base/services/assign-agent-knowledge-base";
import { removeAgentKnowledgeBase } from "@/lib/knowledge-base/services/remove-agent-knowledge-base";

const agentKnowledgeBaseRouteParamsSchema = z.object({
  agentId: z.uuid(),
  knowledgeBaseId: z.uuid(),
});

export const POST = createApiHandler(
  {
    parameters: agentKnowledgeBaseRouteParamsSchema,
  },
  (params, ctx) =>
    assignAgentKnowledgeBase({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      knowledgeBaseId: params.knowledgeBaseId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: agentKnowledgeBaseRouteParamsSchema,
  },
  (params, ctx) =>
    removeAgentKnowledgeBase({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      knowledgeBaseId: params.knowledgeBaseId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
