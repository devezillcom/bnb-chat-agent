import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listChatAgentSessions } from "@/lib/chat-agent/services/list-chat-agent-sessions";

const listChatAgentSessionsQueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
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
      limit: params.limit,
      keyword: params.keyword,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
