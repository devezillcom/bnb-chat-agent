import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { createToolFormSchema } from "@/lib/tools/schema";
import { createTool } from "@/lib/tools/services/create-tool";
import { listTools } from "@/lib/tools/services/list-tools";

const listToolsQueryParamsSchema = z.object({
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
    queryParams: listToolsQueryParamsSchema,
  },
  (params, ctx) =>
    listTools({
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
    requestBody: createToolFormSchema,
  },
  (params, ctx) =>
    createTool({
      ...params,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
