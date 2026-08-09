import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { getChatAgentSessionMessages } from "@/lib/chat-agent/services/get-chat-agent-session-messages";

const chatAgentSessionRouteParamsSchema = z.object({
  sessionId: z.uuid(),
});

const chatAgentSessionQueryParamsSchema = z.object({
  agentId: z.uuid({ error: "Agent is required." }),
});

export const GET = createApiHandler(
  {
    parameters: chatAgentSessionRouteParamsSchema,
    queryParams: chatAgentSessionQueryParamsSchema,
  },
  (params, ctx) =>
    getChatAgentSessionMessages({
      sessionId: params.sessionId,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
