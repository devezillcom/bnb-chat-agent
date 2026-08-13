import { z } from "zod";

import { clearAgentChatContext } from "@/lib/chat-agent/services/clear-agent-chat-context";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const clearAgentChatContextRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const DELETE = createApiHandler(
  {
    parameters: clearAgentChatContextRouteParamsSchema,
  },
  (params, ctx) =>
    clearAgentChatContext({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
