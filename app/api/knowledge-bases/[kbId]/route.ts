import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { deleteKnowledgeBase } from "@/lib/knowledge-base/services/delete-knowledge-base";
import { getKnowledgeBase } from "@/lib/knowledge-base/services/get-knowledge-base";
import { updateKnowledgeBase } from "@/lib/knowledge-base/services/update-knowledge-base";
import { updateKnowledgeBaseNameSchema } from "@/lib/knowledge-base/schema";

const knowledgeBaseRouteParamsSchema = z.object({
  kbId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: knowledgeBaseRouteParamsSchema,
  },
  (params, ctx) =>
    getKnowledgeBase({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const PATCH = createApiHandler(
  {
    parameters: knowledgeBaseRouteParamsSchema,
    requestBody: updateKnowledgeBaseNameSchema,
  },
  (params, ctx) =>
    updateKnowledgeBase({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
      name: params.name,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: knowledgeBaseRouteParamsSchema,
  },
  (params, ctx) =>
    deleteKnowledgeBase({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
