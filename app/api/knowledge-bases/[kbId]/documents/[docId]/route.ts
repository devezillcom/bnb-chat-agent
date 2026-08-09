import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { deleteKnowledgeBaseDocument } from "@/lib/knowledge-base/services/delete-knowledge-base-document";

const documentRouteParamsSchema = z.object({
  kbId: z.uuid(),
  docId: z.uuid(),
});

export const DELETE = createApiHandler(
  {
    parameters: documentRouteParamsSchema,
  },
  (params, ctx) =>
    deleteKnowledgeBaseDocument({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
      documentId: params.docId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
