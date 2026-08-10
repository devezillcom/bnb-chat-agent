import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listChatAgentSessions } from "@/lib/chat-agent/services/list-chat-agent-sessions";

const listChatAgentSessionsQueryParamsSchema = z.object({
  agentId: z.uuid({ error: "Agent is required." }),
  limit: z.coerce.number().pipe(z.int().min(1).max(50)).default(20),
  keyword: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const GET = createApiHandler(
  {
    queryParams: listChatAgentSessionsQueryParamsSchema,
  },
  (params, ctx) =>
    listChatAgentSessions({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      agentId: params.agentId,
      limit: params.limit,
      keyword: params.keyword,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
