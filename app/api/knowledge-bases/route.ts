import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { knowledgeBaseFormSchema } from "@/lib/knowledge-base/schema";
import { createKnowledgeBase } from "@/lib/knowledge-base/services/create-knowledge-base";
import { listKnowledgeBases } from "@/lib/knowledge-base/services/list-knowledge-bases";

const listKnowledgeBasesQueryParamsSchema = z.object({
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
    queryParams: listKnowledgeBasesQueryParamsSchema,
  },
  (params, ctx) =>
    listKnowledgeBases({
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
    requestBody: knowledgeBaseFormSchema,
  },
  (params, ctx) =>
    createKnowledgeBase({
      ...params,
      workspaceId: ctx.workspaceId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
