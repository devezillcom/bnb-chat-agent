import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { getKnowledgeBase } from "@/lib/knowledge-base/services/get-knowledge-base";

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
