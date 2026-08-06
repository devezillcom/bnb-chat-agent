import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { getChatAgentSessionMessages } from "@/lib/chat-agent/services/get-chat-agent-session-messages";

const chatAgentSessionRouteParamsSchema = z.object({
  sessionId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: chatAgentSessionRouteParamsSchema,
  },
  (params, ctx) =>
    getChatAgentSessionMessages({
      sessionId: params.sessionId,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
