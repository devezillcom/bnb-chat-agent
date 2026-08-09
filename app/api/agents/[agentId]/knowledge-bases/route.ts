import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listAgentKnowledgeBases } from "@/lib/knowledge-base/services/list-agent-knowledge-bases";

const listAgentKnowledgeBasesRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: listAgentKnowledgeBasesRouteParamsSchema,
  },
  (params, ctx) =>
    listAgentKnowledgeBases({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
