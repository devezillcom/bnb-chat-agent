import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { chatAgentImageUploadUrlRequestSchema } from "@/lib/chat-agent/schema";
import { getChatAgentImageUploadUrl } from "@/lib/chat-agent/services/get-chat-agent-image-upload-url";

export const POST = createApiHandler(
  {
    requestBody: chatAgentImageUploadUrlRequestSchema,
  },
  (params, ctx) =>
    getChatAgentImageUploadUrl({
      workspaceId: ctx.workspaceId,
      contentType: params.contentType,
      contentLength: params.contentLength,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
