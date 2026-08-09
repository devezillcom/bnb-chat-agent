import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { knowledgeBaseDocumentUploadUrlSchema } from "@/lib/knowledge-base/schema";
import { getKnowledgeBaseDocumentUploadUrl } from "@/lib/knowledge-base/services/get-knowledge-base-document-upload-url";

const uploadUrlRouteParamsSchema = z.object({
  kbId: z.uuid(),
});

export const POST = createApiHandler(
  {
    parameters: uploadUrlRouteParamsSchema,
    requestBody: knowledgeBaseDocumentUploadUrlSchema,
  },
  (params, ctx) =>
    getKnowledgeBaseDocumentUploadUrl({
      workspaceId: ctx.workspaceId,
      knowledgeBaseId: params.kbId,
      filename: params.filename,
      contentType: params.contentType,
      contentLength: params.contentLength,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
