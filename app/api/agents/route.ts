import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { createAgentFormSchema } from "@/lib/agents/schema";
import { createAgent } from "@/lib/agents/services/create-agent";
import { listAgents } from "@/lib/agents/services/list-agents";

const listAgentsQueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  keyword: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  sortKey: z.enum(["name", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = createApiHandler(
  {
    queryParams: listAgentsQueryParamsSchema,
  },
  (params, ctx) =>
    listAgents({
      workspaceId: ctx.workspaceId,
      limit: params.limit,
      offset: params.offset,
      keyword: params.keyword,
      sortKey: params.sortKey,
      sortDirection: params.sortDirection,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const POST = createApiHandler(
  {
    requestBody: createAgentFormSchema,
  },
  (params, ctx) =>
    createAgent({
      ...params,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
