import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { createKnowledgeBaseDocumentSchema } from "@/lib/knowledge-base/schema";
import { createKnowledgeBaseDocument } from "@/lib/knowledge-base/services/create-knowledge-base-document";
import { listKnowledgeBaseDocuments } from "@/lib/knowledge-base/services/list-knowledge-base-documents";

const knowledgeBaseDocumentsRouteParamsSchema = z.object({
  kbId: z.uuid(),
});

const listKnowledgeBaseDocumentsQueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET = createApiHandler(
  {
    parameters: knowledgeBaseDocumentsRouteParamsSchema,
    queryParams: listKnowledgeBaseDocumentsQueryParamsSchema,
  },
  (params, ctx) =>
    listKnowledgeBaseDocuments({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
      limit: params.limit,
      offset: params.offset,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const POST = createApiHandler(
  {
    parameters: knowledgeBaseDocumentsRouteParamsSchema,
    requestBody: createKnowledgeBaseDocumentSchema,
  },
  (params, ctx) =>
    createKnowledgeBaseDocument({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
      key: params.key,
      filename: params.filename,
      contentType: params.contentType,
      contentLength: params.contentLength,
      userId: ctx.userId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
