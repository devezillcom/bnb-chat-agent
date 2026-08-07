import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listConnections } from "@/lib/connections/services/list-connections";

const listConnectionsQueryParamsSchema = z.object({
  keyword: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sortKey: z
    .enum(["name", "channelType", "createdAt", "updatedAt"])
    .default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = createApiHandler(
  {
    queryParams: listConnectionsQueryParamsSchema,
  },
  (params, ctx) =>
    listConnections({
      ...params,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
