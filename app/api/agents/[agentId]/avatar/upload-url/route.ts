import { z } from "zod";

import { getAgentAvatarUploadUrl } from "@/lib/agents/services/get-agent-avatar-upload-url";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const agentAvatarUploadUrlParamsSchema = z.object({
  agentId: z.uuid(),
});

const agentAvatarUploadUrlBodySchema = z.object({
  contentType: z.string().trim().min(1, { error: "Content type is required." }),
  contentLength: z.int().positive({ error: "Image size is required." }),
});

export const POST = createApiHandler(
  {
    parameters: agentAvatarUploadUrlParamsSchema,
    requestBody: agentAvatarUploadUrlBodySchema,
  },
  (params, ctx) =>
    getAgentAvatarUploadUrl({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      contentType: params.contentType,
      contentLength: params.contentLength,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
