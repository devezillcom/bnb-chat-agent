import { z } from "zod";

import { listAgentMentionItems } from "@/lib/agents/services/list-agent-mention-items";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const agentMentionItemsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: agentMentionItemsRouteParamsSchema,
  },
  (params, ctx) =>
    listAgentMentionItems({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
